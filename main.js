const { EmailSender, SmsSender } = require("./src/notifications.js");

const { Room } = require("./src/domain.js");
const { ReservationStore } = require("./src/stores.js");
const { BookingService } = require("./src/booking.js");

const rooms = [
    new Room("R7", "standard"),
    new Room("R8", "deluxe")
];

const store = new ReservationStore();
const sender = process.argv.includes("--sms")
    ? new SmsSender()
    : new EmailSender();

const app = new BookingService(rooms, store, sender);

console.log("1. Свободные номера на 12–14 ноября:");
console.table(
    app.searchFreeRooms("2026-11-12", "2026-11-14")
);

console.log("\n2. Maya бронирует R7:");
console.log(
    app.bookRoom("Maya", "R7", "2026-11-12", "2026-11-14")
);

console.log("\n3. Omar запрашивает занятый R7:");
console.log(
    app.bookRoom("Omar", "R7", "2026-11-13", "2026-11-15")
);

console.log("\n4. Omar бронирует R8:");
console.log(
    app.bookRoom("Omar", "R8", "2026-11-13", "2026-11-15")
);

console.log("\n5. Просмотр брони Maya:");
console.table([app.viewBooking("R101")]);

console.log("\n6. Отмена брони Maya:");
console.log(app.cancelBooking("R101"));

console.log("\n7. Бронь Maya после отмены:");
console.table([app.viewBooking("R101")]);

console.log("\n8. Свободные номера на 13–15 ноября:");
console.table(
    app.searchFreeRooms("2026-11-13", "2026-11-15")
);

console.log("\n9. Свободные номера на 16–18 ноября:");
console.table(
    app.searchFreeRooms("2026-11-16", "2026-11-18")
);
