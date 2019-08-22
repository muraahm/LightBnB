const db = require('./db.js');
const properties = require('./json/properties.json');
const users = require('./json/users.json');

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  const query = `SELECT * FROM users WHERE email = $1`;
  let user;
  return db.query(query, [email])
    .then(res => {
      user = res.rows[0];
      if (user) {
        return user;
      }
      return null;
    })
    .catch(err => console.error('query error', err.stack));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  const query = `SELECT * FROM users WHERE id = $1`;
  let user;
  const inputId = id
  return db.query(query, [inputId])
    .then(res => {
      user = res.rows[0];
      if (user) {
        return user;
      }
      return null;
    })
    .catch(err => console.error('query error', err.stack));
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const query = `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *;`;
  const inputEmail = user.email;
  const inputName = user.name;
  const inputPassword = user.password;
  return db.query(query, [inputName, inputEmail, inputPassword])
    .then(res => res.rows[0])
    .catch(err => console.error('query error', err.stack));
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const inputLimit = limit;
  const inputGuest_id = guest_id;
  const query = `SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`;

  return db.query(query, [inputGuest_id, inputLimit])
    .then(res => res.rows[0])
    .catch(err => console.error('query error', err.stack));
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];

  let query = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_id
    `;

  let filterQueryWord = 'WHERE';
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    query += filterQueryWord;
    query += ` city LIKE $${queryParams.length} `;
  }
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    const numOfParams = queryParams.length;
    if (numOfParams > 1) {
      filterQueryWord = 'AND';
    }
    query += filterQueryWord;
    query += ` owner_id = $${queryParams.length} `;
  }
  if (options.minimum_price_per_night) {
    queryParams.push(Number(options.minimum_price_per_night * 100));
    const numOfParams = queryParams.length;
    if (numOfParams > 1) {
      filterQueryWord = 'AND';
    }
    query += filterQueryWord;
    query += ` cost_per_night >= $${queryParams.length} `;
  }
  if (options.maximum_price_per_night) {
    queryParams.push(Number(options.maximum_price_per_night * 100));
    const numOfParams = queryParams.length;
    if (numOfParams > 1) {
      filterQueryWord = 'AND';
    }
    query += filterQueryWord;
    query += ` cost_per_night <= $${queryParams.length} `;
  }
  
  query += `
  GROUP BY properties.id
  `;
  
  if (options.minimum_rating) {
    queryParams.push(Number(options.minimum_rating));
    query += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }
  
  queryParams.push(limit);
  query += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
  
  //console.log(query, queryParams);
  

  return db.query(query, queryParams)
    .then(res => res.rows);
};

exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const query = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night,
    street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms) VALUES ($1, $2, $3, $4, $5, $6, $7
      $8, $9, $10, $11, $12, $13, $14) RETURNING *;`;

  return db.query(query, [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url,
    property.cost_per_night, property.street, property.city, property.province, property.post_code, property.country, property.parking_spaces,
  property.number_of_bathrooms, property.number_of_bedrooms])
    .then(res => res.rows[0])
    .catch(err => console.error('query error', err.stack));
}
exports.addProperty = addProperty;
