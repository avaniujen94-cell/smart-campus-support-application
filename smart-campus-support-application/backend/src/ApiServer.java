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
        Connection connection = DatabaseConnection.connect();

        if (connection == null) {
            System.out.println("Server was not started because database connection failed.");
            return;
        }

        connection.close();

        HttpServer server = HttpServer.create(
                new InetSocketAddress(PORT),
                0
        );

        // API endpoints
        server.createContext("/api/test", ApiServer::test);
        server.createContext("/api/login", ApiServer::login);
        server.createContext("/api/announcements", ApiServer::announcements);
        server.createContext("/api/events", ApiServer::events);
        server.createContext("/api/locations", ApiServer::locations);
        server.createContext("/api/support-services", ApiServer::supportServices);
        server.createContext("/api/feedback", ApiServer::feedback);

        // Website files
        server.createContext("/", ApiServer::serveWebsite);

        server.setExecutor(null);
        server.start();

        System.out.println();
        System.out.println("Smart Campus backend is running.");
        System.out.println("Open: http://localhost:8080");
        System.out.println();
    }

    // --------------------------------------------------
    // TEST API
    // --------------------------------------------------

    private static void test(HttpExchange exchange) throws IOException {

        sendJson(
                exchange,
                200,
                "{\"success\":true,\"message\":\"Java backend is working.\"}"
        );
    }

    // --------------------------------------------------
    // LOGIN
    // --------------------------------------------------

    private static void login(HttpExchange exchange) throws IOException {

        if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            sendJson(exchange, 405,
                    "{\"success\":false,\"message\":\"POST method required.\"}");
            return;
        }

        String body = readBody(exchange);

        Map<String, String> data = parseJson(body);

        String email = data.get("email");
        String password = data.get("password");

        if (email == null || password == null) {
            sendJson(exchange, 400,
                    "{\"success\":false,\"message\":\"Email and password are required.\"}");
            return;
        }

        String sql =
                "SELECT id, name, email, role " +
                "FROM users " +
                "WHERE email = ? AND password = ?";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, email);
            statement.setString(2, password);

            ResultSet result = statement.executeQuery();

            if (result.next()) {

                String response =
                        "{"
                        + "\"success\":true,"
                        + "\"message\":\"Login successful.\","
                        + "\"user\":{"
                        + "\"id\":" + result.getInt("id") + ","
                        + "\"name\":\"" + escapeJson(result.getString("name")) + "\","
                        + "\"email\":\"" + escapeJson(result.getString("email")) + "\","
                        + "\"role\":\"" + escapeJson(result.getString("role")) + "\""
                        + "}"
                        + "}";

                sendJson(exchange, 200, response);

            } else {

                sendJson(exchange, 401,
                        "{\"success\":false,\"message\":\"Invalid email or password.\"}");
            }

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    "{\"success\":false,\"message\":\"Database error.\"}");
        }
    }

    // --------------------------------------------------
    // ANNOUNCEMENTS
    // --------------------------------------------------

    private static void announcements(HttpExchange exchange)
            throws IOException {

        String sql =
                "SELECT id, title, content, date " +
                "FROM announcements " +
                "ORDER BY date DESC";

        StringBuilder json = new StringBuilder("[");

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet result = statement.executeQuery()) {

            boolean first = true;

            while (result.next()) {

                if (!first) {
                    json.append(",");
                }

                json.append("{")
                        .append("\"id\":").append(result.getInt("id")).append(",")
                        .append("\"title\":\"")
                        .append(escapeJson(result.getString("title")))
                        .append("\",")
                        .append("\"content\":\"")
                        .append(escapeJson(result.getString("content")))
                        .append("\",")
                        .append("\"date\":\"")
                        .append(escapeJson(result.getString("date")))
                        .append("\"")
                        .append("}");

                first = false;
            }

            json.append("]");

            sendJson(exchange, 200, json.toString());

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    "{\"success\":false,\"message\":\"Unable to load announcements.\"}");
        }
    }

    // --------------------------------------------------
    // EVENTS
    // --------------------------------------------------

    private static void events(HttpExchange exchange)
            throws IOException {

        String sql =
                "SELECT id, name, description, date, time, location " +
                "FROM events " +
                "ORDER BY date";

        StringBuilder json = new StringBuilder("[");

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet result = statement.executeQuery()) {

            boolean first = true;

            while (result.next()) {

                if (!first) {
                    json.append(",");
                }

                json.append("{")
                        .append("\"id\":").append(result.getInt("id")).append(",")
                        .append("\"name\":\"")
                        .append(escapeJson(result.getString("name")))
                        .append("\",")
                        .append("\"description\":\"")
                        .append(escapeJson(result.getString("description")))
                        .append("\",")
                        .append("\"date\":\"")
                        .append(escapeJson(result.getString("date")))
                        .append("\",")
                        .append("\"time\":\"")
                        .append(escapeJson(result.getString("time")))
                        .append("\",")
                        .append("\"location\":\"")
                        .append(escapeJson(result.getString("location")))
                        .append("\"")
                        .append("}");

                first = false;
            }

            json.append("]");

            sendJson(exchange, 200, json.toString());

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    "{\"success\":false,\"message\":\"Unable to load events.\"}");
        }
    }

    // --------------------------------------------------
    // CAMPUS LOCATIONS
    // --------------------------------------------------

    private static void locations(HttpExchange exchange)
            throws IOException {

        String sql =
                "SELECT id, building, description, location " +
                "FROM campus " +
                "ORDER BY building";

        StringBuilder json = new StringBuilder("[");

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet result = statement.executeQuery()) {

            boolean first = true;

            while (result.next()) {

                if (!first) {
                    json.append(",");
                }

                json.append("{")
                        .append("\"id\":").append(result.getInt("id")).append(",")
                        .append("\"building\":\"")
                        .append(escapeJson(result.getString("building")))
                        .append("\",")
                        .append("\"description\":\"")
                        .append(escapeJson(result.getString("description")))
                        .append("\",")
                        .append("\"location\":\"")
                        .append(escapeJson(result.getString("location")))
                        .append("\"")
                        .append("}");

                first = false;
            }

            json.append("]");

            sendJson(exchange, 200, json.toString());

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    "{\"success\":false,\"message\":\"Unable to load campus locations.\"}");
        }
    }

    // --------------------------------------------------
    // SUPPORT SERVICES
    // --------------------------------------------------

    private static void supportServices(HttpExchange exchange)
            throws IOException {

        String sql =
                "SELECT id, name, description, contact, location " +
                "FROM services " +
                "ORDER BY name";

        StringBuilder json = new StringBuilder("[");

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet result = statement.executeQuery()) {

            boolean first = true;

            while (result.next()) {

                if (!first) {
                    json.append(",");
                }

                json.append("{")
                        .append("\"id\":").append(result.getInt("id")).append(",")
                        .append("\"name\":\"")
                        .append(escapeJson(result.getString("name")))
                        .append("\",")
                        .append("\"description\":\"")
                        .append(escapeJson(result.getString("description")))
                        .append("\",")
                        .append("\"contact\":\"")
                        .append(escapeJson(result.getString("contact")))
                        .append("\",")
                        .append("\"location\":\"")
                        .append(escapeJson(result.getString("location")))
                        .append("\"")
                        .append("}");

                first = false;
            }

            json.append("]");

            sendJson(exchange, 200, json.toString());

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    "{\"success\":false,\"message\":\"Unable to load support services.\"}");
        }
    }

    // --------------------------------------------------
    // FEEDBACK / ISSUE
    // --------------------------------------------------

    private static void feedback(HttpExchange exchange)
            throws IOException {

        if (!exchange.getRequestMethod().equalsIgnoreCase("POST")) {
            sendJson(exchange, 405,
                    "{\"success\":false,\"message\":\"POST method required.\"}");
            return;
        }

        String body = readBody(exchange);

        Map<String, String> data = parseJson(body);

        String userId = data.get("user_id");
        String subject = data.get("subject");
        String description = data.get("description");
        String type = data.get("type");

        if (subject == null ||
                description == null ||
                type == null) {

            sendJson(exchange, 400,
                    "{\"success\":false,\"message\":\"Required fields are missing.\"}");
            return;
        }

        String sql =
                "INSERT INTO feedback " +
                "(user_id, subject, description, type, status) " +
                "VALUES (?, ?, ?, ?, 'Submitted')";

        try (Connection connection = DatabaseConnection.connect();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            if (userId != null) {
                statement.setInt(1, Integer.parseInt(userId));
            } else {
                statement.setNull(1, java.sql.Types.INTEGER);
            }

            statement.setString(2, subject);
            statement.setString(3, description);
            statement.setString(4, type);

            statement.executeUpdate();

            sendJson(exchange, 200,
                    "{\"success\":true,\"message\":\"Feedback submitted successfully.\"}");

        } catch (Exception e) {

            e.printStackTrace();

            sendJson(exchange, 500,
                    "{\"success\":false,\"message\":\"Unable to save feedback.\"}");
        }
    }

    // --------------------------------------------------
    // SERVE WEBSITE
    // --------------------------------------------------

    private static void serveWebsite(HttpExchange exchange)
        throws IOException {

        String path = exchange.getRequestURI().getPath();

        if (path.equals("/")) {
            path = "/index.html";
        }

        Path srcDirectory = Path.of("src")
                .toAbsolutePath()
                .normalize();

        Path file = srcDirectory
                .resolve(path.substring(1))
                .normalize();

        if (!file.startsWith(srcDirectory)) {
            sendText(exchange, 403, "Forbidden");
            return;
        }

        if (!Files.exists(file) || Files.isDirectory(file)) {
            sendText(exchange, 404, "File not found");
            return;
        }

        byte[] content = Files.readAllBytes(file);

        String contentType = getContentType(file.toString());

        exchange.getResponseHeaders()
                .set("Content-Type", contentType);

        exchange.sendResponseHeaders(200, content.length);

        try (OutputStream output = exchange.getResponseBody()) {
            output.write(content);
        }
    }

    // --------------------------------------------------
    // HELPERS
    // --------------------------------------------------

    private static String readBody(HttpExchange exchange)
            throws IOException {

        return new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
        );
    }

    private static void sendJson(
            HttpExchange exchange,
            int status,
            String json
    ) throws IOException {

        byte[] response =
                json.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders()
                .set("Content-Type", "application/json");

        exchange.getResponseHeaders()
                .set("Access-Control-Allow-Origin", "*");

        exchange.sendResponseHeaders(
                status,
                response.length
        );

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(response);
        }
    }

    private static void sendText(
            HttpExchange exchange,
            int status,
            String text
    ) throws IOException {

        byte[] response =
                text.getBytes(StandardCharsets.UTF_8);

        exchange.getResponseHeaders()
                .set("Content-Type", "text/plain");

        exchange.sendResponseHeaders(
                status,
                response.length
        );

        try (OutputStream output =
                     exchange.getResponseBody()) {

            output.write(response);
        }
    }

    private static String escapeJson(String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static Map<String, String> parseJson(String json) {

        Map<String, String> data = new HashMap<>();

        if (json == null) {
            return data;
        }

        json = json.trim();

        if (json.startsWith("{")) {
            json = json.substring(1);
        }

        if (json.endsWith("}")) {
            json = json.substring(0, json.length() - 1);
        }

        String[] pairs = json.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");

        for (String pair : pairs) {

            String[] keyValue =
                    pair.split(":", 2);

            if (keyValue.length != 2) {
                continue;
            }

            String key =
                    keyValue[0]
                            .trim()
                            .replace("\"", "");

            String value =
                    keyValue[1]
                            .trim()
                            .replace("\"", "");

            value = URLDecoder.decode(
                    value,
                    StandardCharsets.UTF_8
            );

            data.put(key, value);
        }

        return data;
    }

    private static String getContentType(String file) {

        if (file.endsWith(".html")) {
            return "text/html; charset=UTF-8";
        }

        if (file.endsWith(".css")) {
            return "text/css; charset=UTF-8";
        }

        if (file.endsWith(".js")) {
            return "application/javascript; charset=UTF-8";
        }

        if (file.endsWith(".json")) {
            return "application/json; charset=UTF-8";
        }

        return "application/octet-stream";
    }
}