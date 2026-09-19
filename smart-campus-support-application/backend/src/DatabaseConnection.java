import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConnection {

    private static final String URL = "jdbc:sqlite:smart_campus.db";

    public static Connection connect() {

        try {
            Connection connection = DriverManager.getConnection(URL);

            try (var statement = connection.createStatement()) {
                statement.execute("PRAGMA foreign_keys = ON");
            }

            System.out.println("Database connected successfully.");

            return connection;

        } catch (SQLException e) {

            System.out.println(
                    "Database connection failed: " + e.getMessage()
            );

            return null;
        }
    }
}