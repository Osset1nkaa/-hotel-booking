const { Room, Reservation } = require("./src/domain.js");
const { ReservationStore } = require("./src/stores.js");
const { BookingService } = require("./src/booking.js");

async function runRace() {
    const store = new ReservationStore();
    const app = new BookingService(
        [new Room("R7", "standard")],
        store
    );

    let nextId = 101;
    let checked = 0;
    let release;

    const bothChecked = new Promise((resolve) => {
        release = resolve;
    });

    async function unsafeBook(guestName) {
        const checkIn = "2026-11-12";
        const checkOut = "2026-11-14";

        const free = app.isRoomFree("R7", checkIn, checkOut);
        console.log(`${guestName}: номер свободен? ${free}`);

        checked++;

        if (checked === 2) {
            release();
        }

        // Оба запроса должны проверить номер до сохранения.
        await bothChecked;

        if (!free) {
            return "Unavailable";
        }

        const reservation = new Reservation(
            `R${nextId++}`,
            guestName,
            "R7",
            checkIn,
            checkOut
        );

        store.add(reservation);
        return `Accepted: ${reservation.id}`;
    }

    const results = await Promise.all([
        unsafeBook("Maya"),
        unsafeBook("Omar")
    ]);

    results.forEach((result) => console.log(result));
    console.table(store.all());

    if (store.all().length === 2) {
        console.log("Double booking!");
    }
}

if (require.main === module) {
    runRace().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}

module.exports = { runRace };
