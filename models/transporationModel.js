import db from "../config/db.js";

// ==============================
// GET TRANSPORTATION
// ==============================

export const getTransportation = async () => {
  const rows = await db
    .selectFrom("transportation")
    .select(["transportation_id", "location", "distance", "price", "city"])
    .orderBy("city", "asc")
    .orderBy("location", "asc")
    .execute();

  const grouped = rows.reduce((groups, row) => {
    const existingCity = groups.find((group) => group.city === row.city);

    if (existingCity) {
      existingCity.locations.push({
        transportation_id: row.transportation_id,
        location: row.location,
        distance: row.distance,
        price: row.price,
      });
    } else {
      groups.push({
        city: row.city,
        locations: [
          {
            transportation_id: row.transportation_id,
            location: row.location,
            distance: row.distance,
            price: row.price,
          },
        ],
      });
    }

    return groups;
  }, []);

  return {
    r: grouped,
    message: "get transportation",
  };
};

// ==============================
// ADD TRANSPORTATION
// ==============================

export const addTransportation = async (data) => {
  await db
    .insertInto("transportation")
    .values({
      location: data.location,
      distance: data.distance,
      price: data.price,
      city: data.city,
    })
    .execute();

  return {
    message: "Transportation added successfully",
  };
};

// ==============================
// EDIT TRANSPORTATION
// ==============================

export const editTransportation = async (transportation_id, data) => {
  await db
    .updateTable("transportation")
    .set({
      location: data.location,
      distance: data.distance,
      price: data.price,
      city: data.city,
    })
    .where("transportation_id", "=", transportation_id)
    .execute();

  return {
    message: "Transportation updated successfully",
  };
};

// ==============================
// DELETE TRANSPORTATION
// ==============================

export const deleteTransportation = async (transportation_id) => {
  await db
    .deleteFrom("transportation")
    .where("transportation_id", "=", transportation_id)
    .execute();

  return {
    message: "Transportation deleted successfully",
  };
};
