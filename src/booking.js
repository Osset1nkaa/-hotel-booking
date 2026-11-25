const { Reservation } = require("./domain.js");

class BookingService {
    constructor(rooms, store, sender = { send() { } }) {
        this.rooms = rooms;
        this.store = store;
        this.sender = sender;
        this.nextReservationId = 101;
    }

    validateDates(checkIn, checkOut) {
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

    isRoomFree(roomId, checkIn, checkOut) {
        return !this.store.all().some((reservation) =>
            reservation.roomId === roomId &&
            reservation.status === "Confirmed" &&
            checkIn < reservation.checkOut &&
            checkOut > reservation.checkIn
        );
    }

    searchFreeRooms(checkIn, checkOut) {
        const error = this.validateDates(checkIn, checkOut);

        if (error) {
            throw new Error(error);
        }

        return this.rooms.filter((room) =>
            this.isRoomFree(room.id, checkIn, checkOut)
        );
    }

    bookRoom(guestName, roomId, checkIn, checkOut) {
        if (typeof guestName !== "string" || !guestName.trim()) {
            return "Invalid guest name — укажите имя гостя";
        }

        const error = this.validateDates(checkIn, checkOut);

        if (error) {
            return error;
        }

        if (!this.rooms.some((room) => room.id === roomId)) {
            return "Room not found — номер не найден";
        }

        if (!this.isRoomFree(roomId, checkIn, checkOut)) {
            return "Unavailable — номер занят";
        }

        // Пропускаем ID, которые уже есть в хранилище.
        let id;

        do {
            id = `R${this.nextReservationId++}`;
        } while (this.store.findById(id));

        const reservation = new Reservation(
            id, guestName, roomId, checkIn, checkOut
        );

        this.store.add(reservation);

        try {
            this.sender.send(reservation);
        } catch (error) {
            // Бронь уже сохранена и остаётся подтверждённой.
        }

        return `Accepted — бронь ${reservation.id} создана`;
    }

    viewBooking(reservationId) {
        return this.store.findById(reservationId);
    }

    cancelBooking(reservationId) {
        const reservation = this.viewBooking(reservationId);

        if (!reservation) {
            return "Booking not found — бронь не найдена";
        }

        if (reservation.status === "Cancelled") {
            return "Already cancelled — бронь уже отменена";
        }

        reservation.status = "Cancelled";

        return `Cancelled — бронь ${reservationId} отменена`;
    }
}

module.exports = { BookingService };
