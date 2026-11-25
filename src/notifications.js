class EmailSender {
    send(reservation) {
        console.log(
            `[Email demo] ${reservation.guestName}: бронь ${reservation.id} подтверждена`
        );
    }
}

class SmsSender {
    send(reservation) {
        console.log(
            `[SMS demo] ${reservation.guestName}: бронь ${reservation.id} подтверждена`
        );
    }
}

module.exports = { EmailSender, SmsSender };
