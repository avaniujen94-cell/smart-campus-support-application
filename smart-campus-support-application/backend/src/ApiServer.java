import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;

import java.net.InetSocketAddress;
import java.net.URLDecoder;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import java.util.HashMap;
import java.util.Map;


public class ApiServer {

    private static final int PORT = 8080;


    public static void main(String[] args) throws Exception {

        // Test database connection
        Connection connection =
                DatabaseConnection.connect();


        if (connection == null) {

            System.out.println(
                    "Server was not started because database connection failed."
            );

            return;
        }


        connection.close();


        HttpServer server =
                HttpServer.create(
                        new InetSocketAddress(PORT),
                        0
                );


        // API endpoints
        server.createContext(
                "/api/test",
                ApiServer::test
        );

        server.createContext(
                "/api/login",
                ApiServer::login
        );

        server.createContext(
                "/api/announcements",
                ApiServer::announcements
        );

        server.createContext(
                "/api/events",
                ApiServer::events
        );

        server.createContext(
                "/api/locations",
                ApiServer::locations
        );

        server.createContext(
                "/api/support-services",
                ApiServer::supportServices
        );

        server.createContext(
                "/api/feedback",
                ApiServer::feedback
        );


        // Website files
        server.createContext(
                "/",
                ApiServer::serveWebsite
        );


        server.setExecutor(null);

        server.start();


        System.out.println();

        System.out.println(
                "Smart Campus backend is running."
        );

        System.out.println(
                "Open: http://localhost:8080"
        );

        System.out.println();
    }


    // --------------------------------------------------
    // TEST API
    // --------------------------------------------------

    private static void test(
            HttpExchange exchange
    ) throws IOException {

        sendJson(
                exchange,
                200,
                "{\"success\":true,\"message\":\"Java backend is working.\"}"
        );
    }


    // --------------------------------------------------
    // LOGIN
    // --------------------------------------------------

    private static void login(
            HttpExchange exchange
    ) throws IOException {

        if (
                !exchange
                        .getRequestMethod()
                        .equalsIgnoreCase("POST")
        ) {

            sendJson(
                    exchange,
                    405,
                    "{\"success\":false,\"message\":\"POST method required.\"}"
            );

            return;
        }


        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String email =
                data.get("email");

        String password =
                data.get("password");


        if (
                email == null ||
                password == null
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Email and password are required.\"}"
            );

            return;
        }


        String sql =
                "SELECT id, name, email, role " +
                "FROM users " +
                "WHERE email = ? AND password = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    email
            );

            statement.setString(
                    2,
                    password
            );


            ResultSet result =
                    statement.executeQuery();


            if (result.next()) {

                String response =
                        "{"
                        + "\"success\":true,"
                        + "\"message\":\"Login successful.\","
                        + "\"user\":{"
                        + "\"id\":"
                        + result.getInt("id")
                        + ","
                        + "\"name\":\""
                        + escapeJson(
                                result.getString("name")
                        )
                        + "\","
                        + "\"email\":\""
                        + escapeJson(
                                result.getString("email")
                        )
                        + "\","
                        + "\"role\":\""
                        + escapeJson(
                                result.getString("role")
                        )
                        + "\""
                        + "}"
                        + "}";


                sendJson(
                        exchange,
                        200,
                        response
                );

            } else {

                sendJson(
                        exchange,
                        401,
                        "{\"success\":false,\"message\":\"Invalid email or password.\"}"
                );
            }


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Database error.\"}"
            );
        }
    }


        // --------------------------------------------------
    // ANNOUNCEMENTS
    // --------------------------------------------------

    private static void announcements(
            HttpExchange exchange
    ) throws IOException {

        String method =
                exchange
                        .getRequestMethod()
                        .toUpperCase();

        String path =
                exchange
                        .getRequestURI()
                        .getPath();


        // GET ALL ANNOUNCEMENTS
        if (
                method.equals("GET") &&
                path.equals("/api/announcements")
        ) {

            getAnnouncements(exchange);
            return;
        }


        // CREATE ANNOUNCEMENT
        if (
                method.equals("POST") &&
                path.equals("/api/announcements")
        ) {

            createAnnouncement(exchange);
            return;
        }


        // UPDATE ANNOUNCEMENT
        if (
                method.equals("PUT") &&
                path.startsWith("/api/announcements/")
        ) {

            updateAnnouncement(
                    exchange,
                    path
            );

            return;
        }


        // DELETE ANNOUNCEMENT
        if (
                method.equals("DELETE") &&
                path.startsWith("/api/announcements/")
        ) {

            deleteAnnouncement(
                    exchange,
                    path
            );

            return;
        }


        sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed.\"}"
        );
    }


    // --------------------------------------------------
    // GET ANNOUNCEMENTS
    // --------------------------------------------------

    private static void getAnnouncements(
            HttpExchange exchange
    ) throws IOException {

        String sql =
                "SELECT id, title, content, date " +
                "FROM announcements " +
                "ORDER BY date DESC";


        StringBuilder json =
                new StringBuilder("[");


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql);

                ResultSet result =
                        statement.executeQuery()
        ) {

            boolean first = true;


            while (result.next()) {

                if (!first) {

                    json.append(",");
                }


                json.append("{")

                        .append("\"id\":")
                        .append(
                                result.getInt(
                                        "id"
                                )
                        )
                        .append(",")

                        .append("\"title\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "title"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"content\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "content"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"date\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "date"
                                        )
                                )
                        )
                        .append("\"")

                        .append("}");


                first = false;
            }


            json.append("]");


            sendJson(
                    exchange,
                    200,
                    json.toString()
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to load announcements.\"}"
            );
        }
    }


    // --------------------------------------------------
    // CREATE ANNOUNCEMENT
    // --------------------------------------------------

    private static void createAnnouncement(
            HttpExchange exchange
    ) throws IOException {

        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String title =
                data.get("title");

        String content =
                data.get("content");

        String date =
                data.get("date");


        if (
                title == null ||
                title.trim().isEmpty() ||
                content == null ||
                content.trim().isEmpty() ||
                date == null ||
                date.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Title, content and date are required.\"}"
            );

            return;
        }


        String sql =
                "INSERT INTO announcements " +
                "(title, content, date) " +
                "VALUES (?, ?, ?)";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    title.trim()
            );

            statement.setString(
                    2,
                    content.trim()
            );

            statement.setString(
                    3,
                    date.trim()
            );


            int rows =
                    statement.executeUpdate();


            if (rows > 0) {

                sendJson(
                        exchange,
                        200,
                        "{\"success\":true,\"message\":\"Announcement created successfully.\"}"
                );

            } else {

                sendJson(
                        exchange,
                        500,
                        "{\"success\":false,\"message\":\"Announcement was not created.\"}"
                );
            }


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to create announcement.\"}"
            );
        }
    }


    // --------------------------------------------------
    // UPDATE ANNOUNCEMENT
    // --------------------------------------------------

    private static void updateAnnouncement(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/announcements/".length()
                );


        int announcementId;


        try {

            announcementId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid announcement ID.\"}"
            );

            return;
        }


        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String title =
                data.get("title");

        String content =
                data.get("content");

        String date =
                data.get("date");


        if (
                title == null ||
                title.trim().isEmpty() ||
                content == null ||
                content.trim().isEmpty() ||
                date == null ||
                date.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Title, content and date are required.\"}"
            );

            return;
        }


        String sql =
                "UPDATE announcements " +
                "SET title = ?, content = ?, date = ? " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    title.trim()
            );

            statement.setString(
                    2,
                    content.trim()
            );

            statement.setString(
                    3,
                    date.trim()
            );

            statement.setInt(
                    4,
                    announcementId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Announcement not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Announcement updated successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to update announcement.\"}"
            );
        }
    }


    // --------------------------------------------------
    // DELETE ANNOUNCEMENT
    // --------------------------------------------------

    private static void deleteAnnouncement(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/announcements/".length()
                );


        int announcementId;


        try {

            announcementId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid announcement ID.\"}"
            );

            return;
        }


        String sql =
                "DELETE FROM announcements " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    announcementId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Announcement not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Announcement deleted successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,   
                    500,
                    "{\"success\":false,\"message\":\"Unable to delete announcement.\"}"
            );
        }
    }

        // --------------------------------------------------
    // EVENTS
    // --------------------------------------------------

    private static void events(
            HttpExchange exchange
    ) throws IOException {

        String method =
                exchange
                        .getRequestMethod()
                        .toUpperCase();

        String path =
                exchange
                        .getRequestURI()
                        .getPath();


        if (
                method.equals("GET") &&
                path.equals("/api/events")
        ) {

            getEvents(exchange);
            return;
        }


        if (
                method.equals("POST") &&
                path.equals("/api/events")
        ) {

            createEvent(exchange);
            return;
        }


        if (
                method.equals("PUT") &&
                path.startsWith("/api/events/")
        ) {

            updateEvent(
                    exchange,
                    path
            );

            return;
        }


        if (
                method.equals("DELETE") &&
                path.startsWith("/api/events/")
        ) {

            deleteEvent(
                    exchange,
                    path
            );

            return;
        }


        sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed.\"}"
        );
    }


    // --------------------------------------------------
    // GET EVENTS
    // --------------------------------------------------

    private static void getEvents(
            HttpExchange exchange
    ) throws IOException {

        String sql =
                "SELECT " +
                "id, name, description, date, time, location " +
                "FROM events " +
                "ORDER BY date ASC";


        StringBuilder json =
                new StringBuilder("[");


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql);

                ResultSet result =
                        statement.executeQuery()
        ) {

            boolean first = true;


            while (result.next()) {

                if (!first) {
                    json.append(",");
                }


                json.append("{")

                        .append("\"id\":")
                        .append(
                                result.getInt(
                                        "id"
                                )
                        )
                        .append(",")

                        .append("\"name\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "name"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"description\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "description"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"date\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "date"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"time\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "time"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"location\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "location"
                                        )
                                )
                        )
                        .append("\"")

                        .append("}");


                first = false;
            }


            json.append("]");


            sendJson(
                    exchange,
                    200,
                    json.toString()
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to load events.\"}"
            );
        }
    }


    // --------------------------------------------------
    // CREATE EVENT
    // --------------------------------------------------

    private static void createEvent(
            HttpExchange exchange
    ) throws IOException {

        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String name =
                data.get("name");

        String description =
                data.get("description");

        String date =
                data.get("date");

        String time =
                data.get("time");

        String location =
                data.get("location");


        if (
                name == null ||
                name.trim().isEmpty() ||

                description == null ||
                description.trim().isEmpty() ||

                date == null ||
                date.trim().isEmpty() ||

                time == null ||
                time.trim().isEmpty() ||

                location == null ||
                location.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"All event fields are required.\"}"
            );

            return;
        }


        String sql =
                "INSERT INTO events " +
                "(name, description, date, time, location) " +
                "VALUES (?, ?, ?, ?, ?)";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    name.trim()
            );

            statement.setString(
                    2,
                    description.trim()
            );

            statement.setString(
                    3,
                    date.trim()
            );

            statement.setString(
                    4,
                    time.trim()
            );

            statement.setString(
                    5,
                    location.trim()
            );


            int rows =
                    statement.executeUpdate();


            if (rows > 0) {

                sendJson(
                        exchange,
                        200,
                        "{\"success\":true,\"message\":\"Event created successfully.\"}"
                );

            } else {

                sendJson(
                        exchange,
                        500,
                        "{\"success\":false,\"message\":\"Event was not created.\"}"
                );
            }


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to create event.\"}"
            );
        }
    }


    // --------------------------------------------------
    // UPDATE EVENT
    // --------------------------------------------------

    private static void updateEvent(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/events/".length()
                );


        int eventId;


        try {

            eventId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid event ID.\"}"
            );

            return;
        }


        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String name =
                data.get("name");

        String description =
                data.get("description");

        String date =
                data.get("date");

        String time =
                data.get("time");

        String location =
                data.get("location");


        if (
                name == null ||
                name.trim().isEmpty() ||

                description == null ||
                description.trim().isEmpty() ||

                date == null ||
                date.trim().isEmpty() ||

                time == null ||
                time.trim().isEmpty() ||

                location == null ||
                location.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"All event fields are required.\"}"
            );

            return;
        }


        String sql =
                "UPDATE events " +
                "SET name = ?, " +
                "description = ?, " +
                "date = ?, " +
                "time = ?, " +
                "location = ? " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    name.trim()
            );

            statement.setString(
                    2,
                    description.trim()
            );

            statement.setString(
                    3,
                    date.trim()
            );

            statement.setString(
                    4,
                    time.trim()
            );

            statement.setString(
                    5,
                    location.trim()
            );

            statement.setInt(
                    6,
                    eventId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Event not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Event updated successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to update event.\"}"
            );
        }
    }


    // --------------------------------------------------
    // DELETE EVENT
    // --------------------------------------------------

    private static void deleteEvent(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/events/".length()
                );


        int eventId;


        try {

            eventId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid event ID.\"}"
            );

            return;
        }


        String sql =
                "DELETE FROM events " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    eventId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Event not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Event deleted successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to delete event.\"}"
            );
        }
    }

        // --------------------------------------------------
    // CAMPUS LOCATIONS
    // --------------------------------------------------

    private static void locations(
            HttpExchange exchange
    ) throws IOException {

        String method =
                exchange
                        .getRequestMethod()
                        .toUpperCase();

        String path =
                exchange
                        .getRequestURI()
                        .getPath();


        // GET ALL LOCATIONS
        if (
                method.equals("GET") &&
                path.equals("/api/locations")
        ) {

            getLocations(exchange);
            return;
        }


        // CREATE LOCATION
        if (
                method.equals("POST") &&
                path.equals("/api/locations")
        ) {

            createLocation(exchange);
            return;
        }


        // UPDATE LOCATION
        if (
                method.equals("PUT") &&
                path.startsWith("/api/locations/")
        ) {

            updateLocation(
                    exchange,
                    path
            );

            return;
        }


        // DELETE LOCATION
        if (
                method.equals("DELETE") &&
                path.startsWith("/api/locations/")
        ) {

            deleteLocation(
                    exchange,
                    path
            );

            return;
        }


        sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed.\"}"
        );
    }


    // --------------------------------------------------
    // GET LOCATIONS
    // --------------------------------------------------

    private static void getLocations(
            HttpExchange exchange
    ) throws IOException {

        String sql =
                "SELECT " +
                "id, building, description, location, category, " +
                "opening_hours, services, accessibility, directions, " +
                "map_x, map_y " +
                "FROM campus " +
                "ORDER BY id ASC";


        StringBuilder json =
                new StringBuilder("[");


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql);

                ResultSet result =
                        statement.executeQuery()
        ) {

            boolean first = true;


            while (result.next()) {

                if (!first) {
                    json.append(",");
                }


                json.append("{")

                        .append("\"id\":")
                        .append(
                                result.getInt(
                                        "id"
                                )
                        )
                        .append(",")

                        .append("\"building\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "building"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"description\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "description"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"location\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "location"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"category\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "category"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"opening_hours\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "opening_hours"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"services\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "services"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"accessibility\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "accessibility"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"directions\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "directions"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"map_x\":")
                        .append(
                                result.getDouble(
                                        "map_x"
                                )
                        )
                        .append(",")

                        .append("\"map_y\":")
                        .append(
                                result.getDouble(
                                        "map_y"
                                )
                        )

                        .append("}");


                first = false;
            }


            json.append("]");


            sendJson(
                    exchange,
                    200,
                    json.toString()
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to load campus locations.\"}"
            );
        }
    }


    // --------------------------------------------------
    // CREATE LOCATION
    // --------------------------------------------------

    private static void createLocation(
            HttpExchange exchange
    ) throws IOException {

        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String building =
                data.get("building");

        String description =
                data.get("description");

        String location =
                data.get("location");

        String category =
                data.get("category");

        String openingHours =
                data.get("opening_hours");

        String services =
                data.get("services");

        String accessibility =
                data.get("accessibility");

        String directions =
                data.get("directions");

        String mapXText =
                data.get("map_x");

        String mapYText =
                data.get("map_y");


        if (
                building == null ||
                building.trim().isEmpty() ||

                description == null ||
                description.trim().isEmpty() ||

                location == null ||
                location.trim().isEmpty() ||

                category == null ||
                category.trim().isEmpty() ||

                openingHours == null ||
                openingHours.trim().isEmpty() ||

                services == null ||
                services.trim().isEmpty() ||

                accessibility == null ||
                accessibility.trim().isEmpty() ||

                directions == null ||
                directions.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Please complete all location fields.\"}"
            );

            return;
        }


        double mapX;
        double mapY;


        try {

            mapX =
                    Double.parseDouble(
                            mapXText
                    );

            mapY =
                    Double.parseDouble(
                            mapYText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Map X and Map Y must be valid numbers.\"}"
            );

            return;
        }


        if (
                mapX < 0 ||
                mapX > 100 ||
                mapY < 0 ||
                mapY > 100
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Map coordinates must be between 0 and 100.\"}"
            );

            return;
        }


        String sql =
                "INSERT INTO campus " +
                "(building, description, location, category, " +
                "opening_hours, services, accessibility, directions, " +
                "map_x, map_y) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(1, building.trim());
            statement.setString(2, description.trim());
            statement.setString(3, location.trim());
            statement.setString(4, category.trim());
            statement.setString(5, openingHours.trim());
            statement.setString(6, services.trim());
            statement.setString(7, accessibility.trim());
            statement.setString(8, directions.trim());

            statement.setDouble(9, mapX);
            statement.setDouble(10, mapY);


            int rows =
                    statement.executeUpdate();


            if (rows > 0) {

                sendJson(
                        exchange,
                        200,
                        "{\"success\":true,\"message\":\"Campus location created successfully.\"}"
                );

            } else {

                sendJson(
                        exchange,
                        500,
                        "{\"success\":false,\"message\":\"Campus location was not created.\"}"
                );
            }


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to create campus location.\"}"
            );
        }
    }


    // --------------------------------------------------
    // UPDATE LOCATION
    // --------------------------------------------------

    private static void updateLocation(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/locations/".length()
                );


        int locationId;


        try {

            locationId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid campus location ID.\"}"
            );

            return;
        }


        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String building =
                data.get("building");

        String description =
                data.get("description");

        String location =
                data.get("location");

        String category =
                data.get("category");

        String openingHours =
                data.get("opening_hours");

        String services =
                data.get("services");

        String accessibility =
                data.get("accessibility");

        String directions =
                data.get("directions");

        String mapXText =
                data.get("map_x");

        String mapYText =
                data.get("map_y");


        double mapX;
        double mapY;


        try {

            mapX =
                    Double.parseDouble(
                            mapXText
                    );

            mapY =
                    Double.parseDouble(
                            mapYText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Map X and Map Y must be valid numbers.\"}"
            );

            return;
        }


        if (
                building == null ||
                building.trim().isEmpty() ||

                description == null ||
                description.trim().isEmpty() ||

                location == null ||
                location.trim().isEmpty() ||

                category == null ||
                category.trim().isEmpty() ||

                openingHours == null ||
                openingHours.trim().isEmpty() ||

                services == null ||
                services.trim().isEmpty() ||

                accessibility == null ||
                accessibility.trim().isEmpty() ||

                directions == null ||
                directions.trim().isEmpty() ||

                mapX < 0 ||
                mapX > 100 ||
                mapY < 0 ||
                mapY > 100
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Please provide valid location information.\"}"
            );

            return;
        }


        String sql =
                "UPDATE campus SET " +
                "building = ?, " +
                "description = ?, " +
                "location = ?, " +
                "category = ?, " +
                "opening_hours = ?, " +
                "services = ?, " +
                "accessibility = ?, " +
                "directions = ?, " +
                "map_x = ?, " +
                "map_y = ? " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(1, building.trim());
            statement.setString(2, description.trim());
            statement.setString(3, location.trim());
            statement.setString(4, category.trim());
            statement.setString(5, openingHours.trim());
            statement.setString(6, services.trim());
            statement.setString(7, accessibility.trim());
            statement.setString(8, directions.trim());

            statement.setDouble(9, mapX);
            statement.setDouble(10, mapY);

            statement.setInt(11, locationId);


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Campus location not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Campus location updated successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to update campus location.\"}"
            );
        }
    }


    // --------------------------------------------------
    // DELETE LOCATION
    // --------------------------------------------------

    private static void deleteLocation(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/locations/".length()
                );


        int locationId;


        try {

            locationId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid campus location ID.\"}"
            );

            return;
        }


        String sql =
                "DELETE FROM campus " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    locationId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Campus location not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Campus location deleted successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to delete campus location.\"}"
            );
        }
    }


        // --------------------------------------------------
    // SUPPORT SERVICES
    // --------------------------------------------------

    private static void supportServices(
            HttpExchange exchange
    ) throws IOException {

        String method =
                exchange
                        .getRequestMethod()
                        .toUpperCase();

        String path =
                exchange
                        .getRequestURI()
                        .getPath();


        // GET ALL SUPPORT SERVICES
        if (
                method.equals("GET") &&
                path.equals("/api/support-services")
        ) {

            getSupportServices(exchange);
            return;
        }


        // CREATE SUPPORT SERVICE
        if (
                method.equals("POST") &&
                path.equals("/api/support-services")
        ) {

            createSupportService(exchange);
            return;
        }


        // UPDATE SUPPORT SERVICE
        if (
                method.equals("PUT") &&
                path.startsWith("/api/support-services/")
        ) {

            updateSupportService(
                    exchange,
                    path
            );

            return;
        }


        // DELETE SUPPORT SERVICE
        if (
                method.equals("DELETE") &&
                path.startsWith("/api/support-services/")
        ) {

            deleteSupportService(
                    exchange,
                    path
            );

            return;
        }


        sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed.\"}"
        );
    }


    // --------------------------------------------------
    // GET SUPPORT SERVICES
    // --------------------------------------------------

    private static void getSupportServices(
            HttpExchange exchange
    ) throws IOException {

        String sql =
                "SELECT id, name, description, contact, location " +
                "FROM services " +
                "ORDER BY name ASC";


        StringBuilder json =
                new StringBuilder("[");


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql);

                ResultSet result =
                        statement.executeQuery()
        ) {

            boolean first = true;


            while (result.next()) {

                if (!first) {
                    json.append(",");
                }


                json.append("{")

                        .append("\"id\":")
                        .append(
                                result.getInt("id")
                        )
                        .append(",")

                        .append("\"name\":\"")
                        .append(
                                escapeJson(
                                        result.getString("name")
                                )
                        )
                        .append("\",")

                        .append("\"description\":\"")
                        .append(
                                escapeJson(
                                        result.getString("description")
                                )
                        )
                        .append("\",")

                        .append("\"contact\":\"")
                        .append(
                                escapeJson(
                                        result.getString("contact")
                                )
                        )
                        .append("\",")

                        .append("\"location\":\"")
                        .append(
                                escapeJson(
                                        result.getString("location")
                                )
                        )
                        .append("\"")

                        .append("}");


                first = false;
            }


            json.append("]");


            sendJson(
                    exchange,
                    200,
                    json.toString()
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to load support services.\"}"
            );
        }
    }


    // --------------------------------------------------
    // CREATE SUPPORT SERVICE
    // --------------------------------------------------

    private static void createSupportService(
            HttpExchange exchange
    ) throws IOException {

        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String name =
                data.get("name");

        String description =
                data.get("description");

        String contact =
                data.get("contact");

        String location =
                data.get("location");


        if (
                name == null ||
                name.trim().isEmpty() ||

                description == null ||
                description.trim().isEmpty() ||

                contact == null ||
                contact.trim().isEmpty() ||

                location == null ||
                location.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"All support service fields are required.\"}"
            );

            return;
        }


        String sql =
                "INSERT INTO services " +
                "(name, description, contact, location) " +
                "VALUES (?, ?, ?, ?)";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    name.trim()
            );

            statement.setString(
                    2,
                    description.trim()
            );

            statement.setString(
                    3,
                    contact.trim()
            );

            statement.setString(
                    4,
                    location.trim()
            );


            int rows =
                    statement.executeUpdate();


            if (rows > 0) {

                sendJson(
                        exchange,
                        200,
                        "{\"success\":true,\"message\":\"Support service created successfully.\"}"
                );

            } else {

                sendJson(
                        exchange,
                        500,
                        "{\"success\":false,\"message\":\"Support service was not created.\"}"
                );
            }


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to create support service.\"}"
            );
        }
    }


    // --------------------------------------------------
    // UPDATE SUPPORT SERVICE
    // --------------------------------------------------

    private static void updateSupportService(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/support-services/".length()
                );


        int serviceId;


        try {

            serviceId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid support service ID.\"}"
            );

            return;
        }


        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String name =
                data.get("name");

        String description =
                data.get("description");

        String contact =
                data.get("contact");

        String location =
                data.get("location");


        if (
                name == null ||
                name.trim().isEmpty() ||

                description == null ||
                description.trim().isEmpty() ||

                contact == null ||
                contact.trim().isEmpty() ||

                location == null ||
                location.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"All support service fields are required.\"}"
            );

            return;
        }


        String sql =
                "UPDATE services " +
                "SET name = ?, " +
                "description = ?, " +
                "contact = ?, " +
                "location = ? " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    name.trim()
            );

            statement.setString(
                    2,
                    description.trim()
            );

            statement.setString(
                    3,
                    contact.trim()
            );

            statement.setString(
                    4,
                    location.trim()
            );

            statement.setInt(
                    5,
                    serviceId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Support service not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Support service updated successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to update support service.\"}"
            );
        }
    }


    // --------------------------------------------------
    // DELETE SUPPORT SERVICE
    // --------------------------------------------------

    private static void deleteSupportService(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/support-services/".length()
                );


        int serviceId;


        try {

            serviceId =
                    Integer.parseInt(
                            idText
                    );

        } catch (Exception e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid support service ID.\"}"
            );

            return;
        }


        String sql =
                "DELETE FROM services " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setInt(
                    1,
                    serviceId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Support service not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{\"success\":true,\"message\":\"Support service deleted successfully.\"}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to delete support service.\"}"
            );
        }
    }


        // --------------------------------------------------
    // FEEDBACK / ISSUE / ADMIN REPORT MANAGEMENT
    // --------------------------------------------------

    private static void feedback(
            HttpExchange exchange
    ) throws IOException {

        String method =
                exchange
                        .getRequestMethod()
                        .toUpperCase();

        String path =
                exchange
                        .getRequestURI()
                        .getPath();


        // ADMIN - LOAD ALL STUDENT REPORTS
        if (
                method.equals("GET") &&
                path.equals("/api/feedback")
        ) {

            getFeedbackReports(exchange);
            return;
        }


        // STUDENT - SUBMIT NEW REPORT
        if (
                method.equals("POST") &&
                path.equals("/api/feedback")
        ) {

            createFeedbackReport(exchange);
            return;
        }


        // ADMIN - UPDATE REPORT STATUS
        if (
                method.equals("PUT") &&
                path.startsWith("/api/feedback/")
        ) {

            updateFeedbackStatus(
                    exchange,
                    path
            );

            return;
        }


        sendJson(
                exchange,
                405,
                "{\"success\":false,\"message\":\"Method not allowed.\"}"
        );
    }


    // --------------------------------------------------
    // GET ALL FEEDBACK REPORTS
    // --------------------------------------------------

    private static void getFeedbackReports(
            HttpExchange exchange
    ) throws IOException {

        String sql =
                "SELECT " +
                "f.id, " +
                "f.user_id, " +
                "u.name AS user_name, " +
                "u.email AS user_email, " +
                "f.subject, " +
                "f.description, " +
                "f.type, " +
                "f.status " +
                "FROM feedback f " +
                "LEFT JOIN users u " +
                "ON f.user_id = u.id " +
                "ORDER BY f.id DESC";


        StringBuilder json =
                new StringBuilder("[");


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql);

                ResultSet result =
                        statement.executeQuery()
        ) {

            boolean first = true;


            while (result.next()) {

                if (!first) {

                    json.append(",");
                }


                Object userId =
                        result.getObject(
                                "user_id"
                        );


                json.append("{")

                        .append("\"id\":")
                        .append(
                                result.getInt(
                                        "id"
                                )
                        )
                        .append(",")

                        .append("\"user_id\":");


                if (userId == null) {

                    json.append("null");

                } else {

                    json.append(
                            result.getInt(
                                    "user_id"
                            )
                    );
                }


                json.append(",")

                        .append("\"user_name\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "user_name"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"user_email\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "user_email"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"subject\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "subject"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"description\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "description"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"type\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "type"
                                        )
                                )
                        )
                        .append("\",")

                        .append("\"status\":\"")
                        .append(
                                escapeJson(
                                        result.getString(
                                                "status"
                                        )
                                )
                        )
                        .append("\"")

                        .append("}");


                first = false;
            }


            json.append("]");


            sendJson(
                    exchange,
                    200,
                    json.toString()
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to load feedback reports.\"}"
            );
        }
    }


    // --------------------------------------------------
    // CREATE NEW FEEDBACK REPORT
    // --------------------------------------------------

    private static void createFeedbackReport(
            HttpExchange exchange
    ) throws IOException {

        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String userId =
                data.get("user_id");

        String subject =
                data.get("subject");

        String description =
                data.get("description");

        String type =
                data.get("type");


        if (
                subject == null ||
                subject.trim().isEmpty() ||
                description == null ||
                description.trim().isEmpty() ||
                type == null ||
                type.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Required fields are missing.\"}"
            );

            return;
        }


        if (
                !type.equals("Feedback") &&
                !type.equals("Issue") &&
                !type.equals("Complaint")
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid feedback type.\"}"
            );

            return;
        }


        String sql =
                "INSERT INTO feedback " +
                "(user_id, subject, description, type, status) " +
                "VALUES (?, ?, ?, ?, 'Submitted')";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            if (
                    userId != null &&
                    !userId.trim().isEmpty() &&
                    !userId.equalsIgnoreCase("null")
            ) {

                statement.setInt(
                        1,
                        Integer.parseInt(
                                userId
                        )
                );

            } else {

                statement.setNull(
                        1,
                        java.sql.Types.INTEGER
                );
            }


            statement.setString(
                    2,
                    subject.trim()
            );

            statement.setString(
                    3,
                    description.trim()
            );

            statement.setString(
                    4,
                    type
            );


            int rows =
                    statement.executeUpdate();


            if (rows > 0) {

                sendJson(
                        exchange,
                        200,
                        "{\"success\":true,\"message\":\"Feedback submitted successfully.\",\"status\":\"Submitted\"}"
                );

            } else {

                sendJson(
                        exchange,
                        500,
                        "{\"success\":false,\"message\":\"Feedback was not saved.\"}"
                );
            }


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to save feedback.\"}"
            );
        }
    }


    // --------------------------------------------------
    // UPDATE FEEDBACK STATUS
    // --------------------------------------------------

    private static void updateFeedbackStatus(
            HttpExchange exchange,
            String path
    ) throws IOException {

        String idText =
                path.substring(
                        "/api/feedback/".length()
                );


        if (
                idText.isBlank()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Feedback ID is required.\"}"
            );

            return;
        }


        int feedbackId;


        try {

            feedbackId =
                    Integer.parseInt(
                            idText
                    );

        } catch (NumberFormatException e) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid feedback ID.\"}"
            );

            return;
        }


        String body =
                readBody(exchange);


        Map<String, String> data =
                parseJson(body);


        String status =
                data.get("status");


        if (
                status == null ||
                status.trim().isEmpty()
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Status is required.\"}"
            );

            return;
        }


        if (
                !status.equals("Submitted") &&
                !status.equals("In Progress") &&
                !status.equals("Resolved")
        ) {

            sendJson(
                    exchange,
                    400,
                    "{\"success\":false,\"message\":\"Invalid status. Use Submitted, In Progress or Resolved.\"}"
            );

            return;
        }


        String sql =
                "UPDATE feedback " +
                "SET status = ? " +
                "WHERE id = ?";


        try (
                Connection connection =
                        DatabaseConnection.connect();

                PreparedStatement statement =
                        connection.prepareStatement(sql)
        ) {

            statement.setString(
                    1,
                    status
            );

            statement.setInt(
                    2,
                    feedbackId
            );


            int rows =
                    statement.executeUpdate();


            if (rows == 0) {

                sendJson(
                        exchange,
                        404,
                        "{\"success\":false,\"message\":\"Feedback report was not found.\"}"
                );

                return;
            }


            sendJson(
                    exchange,
                    200,
                    "{"
                            + "\"success\":true,"
                            + "\"message\":\"Report status updated successfully.\","
                            + "\"id\":"
                            + feedbackId
                            + ","
                            + "\"status\":\""
                            + escapeJson(status)
                            + "\""
                            + "}"
            );


        } catch (Exception e) {

            e.printStackTrace();


            sendJson(
                    exchange,
                    500,
                    "{\"success\":false,\"message\":\"Unable to update feedback status.\"}"
            );
        }
    }


    // --------------------------------------------------
    // SERVE WEBSITE
    // --------------------------------------------------

    private static void serveWebsite(
            HttpExchange exchange
    ) throws IOException {

        String path =
                exchange
                        .getRequestURI()
                        .getPath();


        if (path.equals("/")) {

            path =
                    "/index.html";
        }


        Path srcDirectory =
                Path.of("src")
                        .toAbsolutePath()
                        .normalize();


        Path file =
                srcDirectory
                        .resolve(
                                path.substring(1)
                        )
                        .normalize();


        if (
                !file.startsWith(
                        srcDirectory
                )
        ) {

            sendText(
                    exchange,
                    403,
                    "Forbidden"
            );

            return;
        }


        if (
                !Files.exists(file) ||
                Files.isDirectory(file)
        ) {

            sendText(
                    exchange,
                    404,
                    "File not found"
            );

            return;
        }


        byte[] content =
                Files.readAllBytes(file);


        String contentType =
                getContentType(
                        file.toString()
                );


        exchange
                .getResponseHeaders()
                .set(
                        "Content-Type",
                        contentType
                );


        exchange.sendResponseHeaders(
                200,
                content.length
        );


        try (
                OutputStream output =
                        exchange.getResponseBody()
        ) {

            output.write(
                    content
            );
        }
    }


    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    private static String readBody(
            HttpExchange exchange
    ) throws IOException {

        return new String(

                exchange
                        .getRequestBody()
                        .readAllBytes(),

                StandardCharsets.UTF_8
        );
    }


    private static void sendJson(
            HttpExchange exchange,
            int status,
            String json
    ) throws IOException {

        byte[] response =
                json.getBytes(
                        StandardCharsets.UTF_8
                );


        exchange
                .getResponseHeaders()
                .set(
                        "Content-Type",
                        "application/json"
                );


        exchange
                .getResponseHeaders()
                .set(
                        "Access-Control-Allow-Origin",
                        "*"
                );


        exchange.sendResponseHeaders(
                status,
                response.length
        );


        try (
                OutputStream output =
                        exchange.getResponseBody()
        ) {

            output.write(
                    response
            );
        }
    }


    private static void sendText(
            HttpExchange exchange,
            int status,
            String text
    ) throws IOException {

        byte[] response =
                text.getBytes(
                        StandardCharsets.UTF_8
                );


        exchange
                .getResponseHeaders()
                .set(
                        "Content-Type",
                        "text/plain"
                );


        exchange.sendResponseHeaders(
                status,
                response.length
        );


        try (
                OutputStream output =
                        exchange.getResponseBody()
        ) {

            output.write(
                    response
            );
        }
    }


    private static String escapeJson(
            String value
    ) {

        if (value == null) {

            return "";
        }


        return value

                .replace(
                        "\\",
                        "\\\\"
                )

                .replace(
                        "\"",
                        "\\\""
                )

                .replace(
                        "\n",
                        "\\n"
                )

                .replace(
                        "\r",
                        "\\r"
                )

                .replace(
                        "\t",
                        "\\t"
                );
    }


    private static Map<String, String> parseJson(
            String json
    ) {

        Map<String, String> data =
                new HashMap<>();


        if (json == null) {

            return data;
        }


        json =
                json.trim();


        if (
                json.startsWith("{")
        ) {

            json =
                    json.substring(1);
        }


        if (
                json.endsWith("}")
        ) {

            json =
                    json.substring(
                            0,
                            json.length() - 1
                    );
        }


        String[] pairs =
                json.split(
                        ",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)"
                );


        for (
                String pair : pairs
        ) {

            String[] keyValue =
                    pair.split(
                            ":",
                            2
                    );


            if (
                    keyValue.length != 2
            ) {

                continue;
            }


            String key =
                    keyValue[0]
                            .trim()
                            .replace(
                                    "\"",
                                    ""
                            );


            String value =
                    keyValue[1]
                            .trim()
                            .replace(
                                    "\"",
                                    ""
                            );


            value =
                    URLDecoder.decode(
                            value,
                            StandardCharsets.UTF_8
                    );


            data.put(
                    key,
                    value
            );
        }


        return data;
    }


    private static String getContentType(
            String file
    ) {

        if (
                file.endsWith(".html")
        ) {

            return "text/html; charset=UTF-8";
        }


        if (
                file.endsWith(".css")
        ) {

            return "text/css; charset=UTF-8";
        }


        if (
                file.endsWith(".js")
        ) {

            return "application/javascript; charset=UTF-8";
        }


        if (
                file.endsWith(".json")
        ) {

            return "application/json; charset=UTF-8";
        }


        return "application/octet-stream";
    }
}