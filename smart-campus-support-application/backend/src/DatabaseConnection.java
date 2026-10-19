import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;


public class DatabaseConnection {

    private static Path getDatabasePath() {

        try {

            /*
             * The compiled classes are stored in:
             *
             * project/backend/bin/
             *
             * So:
             * bin parent     = backend
             * backend parent = project root
             *
             * smart_campus.db is stored in the project root.
             */

            URI classLocation =
                    DatabaseConnection.class
                            .getProtectionDomain()
                            .getCodeSource()
                            .getLocation()
                            .toURI();


            Path binFolder =
                    Path.of(classLocation)
                            .toAbsolutePath()
                            .normalize();


            Path backendFolder =
                    binFolder.getParent();


            Path projectFolder =
                    backendFolder.getParent();


            Path database =
                    projectFolder
                            .resolve("smart_campus.db")
                            .normalize();


            if (Files.exists(database)) {

                return database;
            }


            System.out.println(
                    "Database file was not found at:"
            );

            System.out.println(
                    database
            );


            return null;


        } catch (Exception e) {

            System.out.println(
                    "Unable to locate database: "
                            + e.getMessage()
            );

            return null;
        }
    }


    public static Connection connect() {

        Path databasePath =
                getDatabasePath();


        if (databasePath == null) {

            return null;
        }


        String url =
                "jdbc:sqlite:"
                        + databasePath;


        try {

            Connection connection =
                    DriverManager.getConnection(url);


            try (
                    var statement =
                            connection.createStatement()
            ) {

                statement.execute(
                        "PRAGMA foreign_keys = ON"
                );

            }


            System.out.println(
                    "Database connected successfully."
            );


            System.out.println(
                    "Using database: "
                            + databasePath
            );


            return connection;


        } catch (SQLException e) {

            System.out.println(
                    "Database connection failed: "
                            + e.getMessage()
            );


            return null;
        }
    }
}