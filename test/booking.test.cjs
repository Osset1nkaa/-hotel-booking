const { test } = require("node:test");
const assert = require("node:assert/strict");

const { Room } = require("../src/domain.js");
const { ReservationStore } = require("../src/stores.js");
const { BookingService } = require("../src/booking.js");

function createApp() {
    const rooms = [
        new Room("R7", "standard"),
        new Room("R8", "deluxe")
    ];

    const store = new ReservationStore();

    return new BookingService(rooms, store);
}

test("1. Поиск возвращает свободные номера", () => {
    const app = createApp();

    const freeRooms = app.searchFreeRooms(
        "2026-11-12",
        "2026-11-14"
    );

    assert.equal(
        freeRooms.map((room) => room.id).join(","),
        "R7,R8"
    );

    app.bookRoom(
        "Maya", "R7", "2026-11-12", "2026-11-14"
    );

    const remaining = app.searchFreeRooms(
        "2026-11-12",
        "2026-11-14"
    );

    assert.equal(
        remaining.map((room) => room.id).join(","),
        "R8"
    );
});

test("2. Бронирование сохраняется и доступно по ID", () => {
    const app = createApp();

    const result = app.bookRoom(
        "Maya", "R7", "2026-11-12", "2026-11-14"
    );

    assert.equal(result, "Accepted — бронь R101 создана");

    const booking = app.viewBooking("R101");

    assert.equal(booking.guestName, "Maya");
    assert.equal(booking.roomId, "R7");
    assert.equal(booking.checkIn, "2026-11-12");
    assert.equal(booking.checkOut, "2026-11-14");
    assert.equal(booking.status, "Confirmed");
    assert.equal(app.viewBooking("UNKNOWN"), null);
});

test("3. Пересекающаяся бронь отклоняется", () => {
    const app = createApp();

    app.bookRoom(
        "Maya", "R7", "2026-11-12", "2026-11-14"
    );

    const result = app.bookRoom(
        "Omar", "R7", "2026-11-13", "2026-11-15"
    );

    assert.equal(result, "Unavailable — номер занят");
    assert.equal(app.viewBooking("R102"), null);
    assert.equal(app.viewBooking("R101").guestName, "Maya");
});

test("4. Заезд в день выезда разрешён", () => {
    const app = createApp();

    app.bookRoom(
        "Maya", "R7", "2026-11-12", "2026-11-14"
    );

    const result = app.bookRoom(
        "Omar", "R7", "2026-11-14", "2026-11-16"
    );

    assert.equal(result, "Accepted — бронь R102 создана");
    assert.equal(app.viewBooking("R102").guestName, "Omar");
});

test("5. Отмена освобождает номер", () => {
    const app = createApp();

    app.bookRoom(
        "Maya", "R7", "2026-11-12", "2026-11-14"
    );

    assert.equal(
        app.cancelBooking("R101"),
        "Cancelled — бронь R101 отменена"
    );

    assert.equal(
        app.viewBooking("R101").status,
        "Cancelled"
    );

    const result = app.bookRoom(
        "Omar", "R7", "2026-11-13", "2026-11-15"
    );

    assert.equal(result, "Accepted — бронь R102 создана");
});

test("6. Неверные данные не создают бронирование", () => {
    const app = createApp();

    assert.equal(
        app.bookRoom(
            " ", "R7", "2026-11-12", "2026-11-14"
        ),
        "Invalid guest name — укажите имя гостя"
    );

    assert.equal(
        app.bookRoom(
            "Ali", "R7", "2026-02-30", "2026-03-02"
        ),
        "Invalid dates — нужны реальные даты в формате YYYY-MM-DD"
    );

    assert.equal(
        app.bookRoom(
            "Ali", "R7", "2026-11-14", "2026-11-12"
        ),
        "Invalid dates — выезд должен быть позже заезда"
    );

    assert.equal(
        app.bookRoom(
            "Ali", "R99", "2026-11-12", "2026-11-14"
        ),
        "Room not found — номер не найден"
    );

    assert.throws(
        () => app.searchFreeRooms(
            "2026-11-14", "2026-11-12"
        ),
        /выезд должен быть позже заезда/
    );

    assert.equal(app.viewBooking("R101"), null);
});

test("7. Подтверждение отправляется только для принятой брони", () => {
    const rooms = [new Room("R7", "standard")];
    const store = new ReservationStore();

    // Подставной отправитель записывает вызовы.
    const sent = [];
    const sender = {
        send(reservation) {
            sent.push({
                id: reservation.id,
                savedBeforeSend:
                    store.findById(reservation.id) === reservation
            });
        }
    };

    const app = new BookingService(rooms, store, sender);

    assert.equal(
        app.bookRoom(
            "Maya", "R7", "2026-11-12", "2026-11-14"
        ),
        "Accepted — бронь R101 создана"
    );

    assert.equal(
        app.bookRoom(
            "Omar", "R7", "2026-11-13", "2026-11-15"
        ),
        "Unavailable — номер занят"
    );

    assert.deepEqual(sent, [
        { id: "R101", savedBeforeSend: true }
    ]);
});

test("8. Ошибка отправки не теряет сохранённую бронь", () => {
    const rooms = [new Room("R7", "standard")];
    const store = new ReservationStore();

    let attempts = 0;

    const failingSender = {
        send() {
            attempts++;
            throw new Error("Email service unavailable");
        }
    };

    const app = new BookingService(
        rooms,
        store,
        failingSender
    );

    const result = app.bookRoom(
        "Maya", "R7", "2026-11-12", "2026-11-14"
    );

    assert.equal(attempts, 1);
    assert.equal(result, "Accepted — бронь R101 создана");
    assert.equal(app.viewBooking("R101").status, "Confirmed");
    assert.equal(store.all().length, 1);

    // Сохранённая бронь продолжает занимать номер.
    assert.equal(
        app.bookRoom(
            "Omar", "R7", "2026-11-13", "2026-11-15"
        ),
        "Unavailable — номер занят"
    );

    assert.equal(attempts, 1);
});