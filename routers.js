import express from "express";
import uniqid from "uniqid";

const router = express.Router();

let rooms = [];
let roomNo = 100;
let bookings = [];
let date_regex = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/;
let time_regex = /^(0[0-9]|1\d|2[0-3])\:(00)/;

router.get("/", (req, res) =>{
  res.status(200).send({
    output: "Homepage",
  });
});

router.get("/getAllRooms", (req, res) => {
  if (rooms.length) {
    res.status(200).send({
      output: rooms,
    });
  } else {
    res.status(200).send({
      message: "No rooms created",
    });
  }
});

router.get("/getAllBookings", (req, res) => {
  if (bookings.length) {
    res.status(200).send({
      output: bookings,
    });
  } else {
    res.status(200).send({
      message: "No bookings available",
    });
  }
});

// Get All Rooms list with Booked Data
router.get("/getRoomBookings", (req, res) => {
  if (rooms.length) {
    const roomsList = rooms.map((room) => ({
      roomNo: room.roomNo,
      bookings: room.bookings,
    }));
    res.status(200).send({
      output: roomsList,
    });
  } else {
    res.status(200).send({
      message: "No rooms created",
    });
  }
});

router.post("/createRoom", (req, res) => {
  let room = {};
  room.id = uniqid();
  room.roomNo = roomNo;
  room.bookings = [];
  let isCorrect = true;

  if (req.body.noSeats) {
    if (!Number.isInteger(req.body.noSeats)) {
      res
        .status(400)
        .send({ output: "Enter only integer values for Number of Seats" });
      isCorrect = false;
      return;
    }
  } else {
    res
      .status(400)
      .send({ output: "Please specify No of seats for Room" });
    isCorrect = false;
    return;
  }
  if (req.body.amenities) {
    if (!Array.isArray(req.body.amenities)) {
      res
        .status(400)
        .send({ output: "Amenities list accepts only array of strings" });
      isCorrect = false;
      return;
    }
  } else {
    res.status(400).send({
      output: "Please specify all Amenities for Room in Array format",
    });
    isCorrect = false;
    return;
  }
  if (req.body.pricePerHour) {
    if (isNaN(req.body.pricePerHour)) {
      res
        .status(400)
        .send({ output: "Enter only digits for Price per Hour" });
      isCorrect = false;
      return;
    }
  } else {
    res
      .status(400)
      .send({ output: "Please specify price per hour for Room" });
    isCorrect = false;
    return;
  }

  if (isCorrect) {
    room.noSeats = req.body.noSeats;
    room.amenities = req.body.amenities;
    room.pricePerHour = req.body.pricePerHour;
    rooms.push(room);
    roomNo++;
    res.status(200).send({ output: "Room Created Successfully" });
  }
});

router.post("/createBooking", (req, res) => {
  let isCorrect = true;
  let checkRoom = [];

  if (rooms.length) {
    if (req.body.roomNo) {
      if (Number.isInteger(req.body.roomNo)) {
        checkRoom = rooms.filter((room) => room.roomNo === req.body.roomNo);
        if (!checkRoom.length) {
          res.status(400).send({
            output: `No room available with room ${req.body.roomNo} for booking`,
          });
          return;
        }
      } else {
        res
          .status(400)
          .send({ output: "Enter only integer values for Room Number" });
        isCorrect = false;
        return;
      }
    } else {
      res.status(400).send({
        output: `Please specify a Room Number(field: "roomNo") for booking`,
      });
      isCorrect = false;
      return;
    }

    if (!req.body.custName) {
      res
        .status(400)
        .send({ output: "Please specify customer Name for booking" });
      isCorrect = false;
      return;
    }

    if (req.body.date) {
      if (!date_regex.test(req.body.date)) {
        res
          .status(400)
          .send({ output: "Please specify date in MM/DD/YYYY" });
        isCorrect = false;
        return;
      }
    } else {
      res.status(400).send({ output: "Please specify date for booking." });
      isCorrect = false;
      return;
    }

    if (req.body.startTime) {
      if (time_regex.test(req.body.startTime)) {
        let dateTime = `${req.body.date.substring(6)}-${req.body.date.substring(0, 2)}-${req.body.date.substring(3,5)}`;
        const currentDateTime = new Date(new Date().toString()).getTime();
        dateTime = new Date(
          new Date(`${dateTime}T${req.body.startTime}`).toString()
        ).getTime();

        if (dateTime < currentDateTime) {
          res.status(400).send({
            output:
              "Please specify a current or future date and time for booking.",
          });
          isCorrect = false;
          return;
        }
      } else {
        res.status(400).send({
          output:
            "Please specify time in hh:min(24-hr format) where minutes should be 00 only",
        });
        isCorrect = false;
        return;
      }
    } else {
      res
        .status(400)
        .send({ output: "Please specify Starting time for booking." });
      isCorrect = false;
      return;
    }

    if (req.body.endTime) {
      if (time_regex.test(req.body.endTime)) {
        if (
          parseInt(req.body.startTime.substring(0, 2)) >=
          parseInt(req.body.endTime.substring(0, 2))
        ) {
          res.status(400).send({
            output: "End time must be greater than Start time",
          });
          isCorrect = false;
          return;
        }
      } else {
        res.status(400).send({
          output:
            "Please specify time in hh:min(24-hr format) where minutes should be 00 only",
        });
        isCorrect = false;
        return;
      }
    } else {
      res
        .status(400)
        .send({ output: "Please specify Ending time for booking." });
      isCorrect = false;
      return;
    }

    let isAvailable = false;
    if (checkRoom[0].bookings.length) {
      const sameDateBookings = checkRoom[0].bookings.filter(
        (book) => book.date === req.body.date && book.bookingStatus === true
      );

      if (sameDateBookings.length) {
        let isTimeAvailable = true;

        sameDateBookings.map((book) => {
          if (
            !(
              (parseInt(book.startTime.substring(0, 2)) >
                parseInt(req.body.startTime.substring(0, 2)) &&
                parseInt(book.startTime.substring(0, 2)) >=
                  parseInt(req.body.endTime.substring(0, 2))) ||
              (parseInt(book.endTime.substring(0, 2)) <=
                parseInt(req.body.startTime.substring(0, 2)) &&
                parseInt(book.endTime.substring(0, 2)) <
                  parseInt(req.body.endTime.substring(0, 2)))
            )
          ) {
            isTimeAvailable = false;
          }
        });

        if (isTimeAvailable) {
          isAvailable = true;
        }
      } else {
        isAvailable = true;
      }
    } else {
      isAvailable = true;
    }

    if (!isAvailable) {
      res.status(400).send({
        output: `Room ${req.body.roomNo} is not available on Selected Date and Time`,
      });
      return;
    } else {
      if (isCorrect) {
        let count = 0;
        rooms.forEach((element) => {
          if (element.roomNo === req.body.roomNo) {
            rooms[count].bookings.push({
              id: uniqid(),
              custName: req.body.custName,
              bookingStatus: true,
              date: req.body.date,
              startTime: req.body.startTime,
              endTime: req.body.endTime,
            });
          }
          count++;
        });

        let bookingRec = req.body;
        bookingRec.cost =
          checkRoom[0].pricePerHour *
          (parseInt(bookingRec.endTime.substring(0, 2)) -
            parseInt(bookingRec.startTime.substring(0, 2)));

        bookings.push(bookingRec);
        res.status(200).send({ output: "Room Booking Successfully" });
      } else {
        res.status(400).send({ output: "Error in entered data" });
        return;
      }
    }
  } else {
    res.status(400).send({ output: "No rooms created for booking" });
    return;
  }
});

export const hallRouter = router;