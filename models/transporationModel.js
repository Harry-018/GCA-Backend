import db from "../config/db.js";
import { logAdminActivity } from "./activityLogsModel.js";

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

export const addTransportation = async (data, user_id) => {
  await db
    .insertInto("transportation")
    .values({
      location: data.location,
      distance: data.distance,
      price: data.price,
      city: data.city,
    })
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Created",
    user_module: "Transportation",
    description: `Created transportation route ${data.location} in ${data.city}.`,
  });

  return {
    message: "Transportation added successfully",
  };
};

// ==============================
// EDIT TRANSPORTATION
// ==============================

export const editTransportation = async (
  transportation_id,
  data,
  user_id,
) => {
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

  await logAdminActivity({
    user_id,
    user_action: "Updated",
    user_module: "Transportation",
    description: `Updated transportation route ${data.location} in ${data.city}.`,
  });

  return {
    message: "Transportation updated successfully",
  };
};

// ==============================
// DELETE TRANSPORTATION
// ==============================

export const deleteTransportation = async (transportation_id, user_id) => {
  const route = await db
    .selectFrom("transportation")
    .select(["location", "city"])
    .where("transportation_id", "=", transportation_id)
    .executeTakeFirst();

  await db
    .deleteFrom("transportation")
    .where("transportation_id", "=", transportation_id)
    .execute();

  await logAdminActivity({
    user_id,
    user_action: "Deleted",
    user_module: "Transportation",
    description: `Deleted transportation route ${route ? `${route.location} in ${route.city}` : "entry"}.`,
  });

  return {
    message: "Transportation deleted successfully",
  };
};
