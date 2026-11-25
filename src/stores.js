class ReservationStore {
    constructor(reservations = []) {
        this.reservations = reservations;
    }

    all() {
        return this.reservations;
    }

    add(reservation) {
        this.reservations.push(reservation);
    }

    findById(id) {
        return this.reservations.find(
            (reservation) => reservation.id === id
        ) ?? null;
    }
}

module.exports = { ReservationStore };
