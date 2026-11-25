class Room {
    constructor(id, type) {
        this.id = id;
        this.type = type;
    }
}

class Reservation {
    constructor(id, guestName, roomId, checkIn, checkOut) {
        this.id = id;
        this.guestName = guestName;
        this.roomId = roomId;
        this.checkIn = checkIn;
        this.checkOut = checkOut;
        this.status = "Confirmed";
    }
}

module.exports = {
    Room,
    Reservation
};
