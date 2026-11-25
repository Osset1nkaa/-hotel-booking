const { Room, Reservation } = require("../src/domain.js");

const rooms = [
    new Room("R7", "standard"),
    new Room("R8", "deluxe")
];

console.table(rooms);

const mayaReservation = new Reservation(
    "R101",
    "Maya",
    "R7",
    "2026-11-12",
    "2026-11-14"
);

console.log("\nБронирование Maya:");
console.table([mayaReservation]);

// Общий список бронирований.
const reservations = [mayaReservation];

function isRoomFree(roomId, checkIn, checkOut) {
    const hasConflict = reservations.some((reservation) => {
        return (
            reservation.roomId === roomId &&
            reservation.status === "Confirmed" &&
            checkIn < reservation.checkOut &&
            checkOut > reservation.checkIn
        );
    });

    return !hasConflict;
}

console.log("\nR7 свободен на 13–15 ноября?");
console.log(isRoomFree("R7", "2026-11-13", "2026-11-15"));

console.log("\nR8 свободен на 13–15 ноября?");
console.log(isRoomFree("R8", "2026-11-13", "2026-11-15"));

console.log("\nR7 свободен на 14–16 ноября?");
console.log(isRoomFree("R7", "2026-11-14", "2026-11-16"));

// R101 уже принадлежит Maya, поэтому начинаем с R102.
let nextReservationId = 102;

function bookRoom(guestName, roomId, checkIn, checkOut) {

        if (typeof guestName !== "string" || !guestName.trim()) {
        return "Invalid guest name — укажите имя гостя";
    }

    const dateError = validateDates(checkIn, checkOut);

    if (dateError) {
        return dateError;
    } 

    const roomExists = rooms.some((room) => room.id === roomId);

    if (!roomExists) {
        return "Room not found — номер не найден";
    }

    if (!isRoomFree(roomId, checkIn, checkOut)) {
        return "Unavailable — номер занят";
    }

    const reservation = new Reservation(
        `R${nextReservationId++}`,
        guestName,
        roomId,
        checkIn,
        checkOut
    );

    reservations.push(reservation);

    return `Accepted — бронь ${reservation.id} создана`;
}

console.log("\nOmar бронирует R7 на 13–15 ноября:");
console.log(
    bookRoom("Omar", "R7", "2026-11-13", "2026-11-15")
);

console.log("\nOmar бронирует R8 на 13–15 ноября:");
console.log(
    bookRoom("Omar", "R8", "2026-11-13", "2026-11-15")
);

console.log("\nВсе бронирования:");
console.table(reservations);

function viewBooking(reservationId) {
    return reservations.find(
        (reservation) => reservation.id === reservationId
    ) ?? null;
}

function cancelBooking(reservationId) {
    const reservation = viewBooking(reservationId);

    if (!reservation) {
        return "Booking not found — бронь не найдена";
    }

    if (reservation.status === "Cancelled") {
        return "Already cancelled — бронь уже отменена";
    }

    reservation.status = "Cancelled";

    return `Cancelled — бронь ${reservationId} отменена`;
}

// Просматриваем бронь Maya.
console.log("\nБронь R101 до отмены:");
console.table([viewBooking("R101")]);

// Отменяем бронь Maya.
console.log("\nОтмена R101:");
console.log(cancelBooking("R101"));

// Проверяем статус после отмены.
console.log("\nБронь R101 после отмены:");
console.table([viewBooking("R101")]);

// Проверяем, освободился ли номер.
console.log("\nR7 свободен на 13–15 ноября после отмены?");
console.log(isRoomFree("R7", "2026-11-13", "2026-11-15"));

function searchFreeRooms(checkIn, checkOut) {
    const dateError = validateDates(checkIn, checkOut);

    if (dateError) {
        throw new Error(dateError);
    }

    return rooms.filter((room) =>
        isRoomFree(room.id, checkIn, checkOut)
    );
}
function validateDates(checkIn, checkOut) {
    function isValidDate(value) {
        if (
            typeof value !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
            return false;
        }

        const date = new Date(`${value}T00:00:00Z`);

        return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10) === value
        );
    }

    if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
        return "Invalid dates — нужны реальные даты в формате YYYY-MM-DD";
    }

    if (checkIn >= checkOut) {
        return "Invalid dates — выезд должен быть позже заезда";
    }

    return null;
}

console.log("\nПроверка пустого имени:");
console.log(
    bookRoom("   ", "R7", "2026-11-16", "2026-11-18")
);

console.log("\nПроверка несуществующей даты:");
console.log(
    bookRoom("Ali", "R7", "2026-02-30", "2026-03-02")
);

console.log("\nПроверка выезда раньше заезда:");
console.log(
    bookRoom("Ali", "R7", "2026-11-18", "2026-11-16")
);

console.log("\nПроверка неправильных дат при поиске:");
try {
    searchFreeRooms("2026-11-18", "2026-11-16");
} catch (error) {
    console.log(error.message);
}