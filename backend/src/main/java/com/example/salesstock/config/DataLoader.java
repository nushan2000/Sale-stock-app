//package com.example.salesstock.config;
//
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.core.io.ClassPathResource;
//import org.springframework.jdbc.core.JdbcTemplate;
//import org.springframework.stereotype.Component;
//
//import java.nio.charset.StandardCharsets;
//
//@Component
//public class DataLoader implements CommandLineRunner {
//
//    private final JdbcTemplate jdbcTemplate;
//
//    public DataLoader(JdbcTemplate jdbcTemplate) {
//        this.jdbcTemplate = jdbcTemplate;
//    }
//
//    @Override
//    public void run(String... args) throws Exception {
//
//        Integer count = jdbcTemplate.queryForObject(
//                "SELECT COUNT(*) FROM product",
//                Integer.class
//        );
//
//        if (count != null && count == 0) {
//            System.out.println("Database empty. Loading dump...");
//
//            String sql = new String(
//                    new ClassPathResource("Dump20260427.sql").getInputStream().readAllBytes(),
//                    StandardCharsets.UTF_8
//            );
//
//            // Remove /*!...*/ directives
//            sql = sql.replaceAll("/\\*!.*?\\*/", "");
//            // Remove -- comments
//            sql = sql.replaceAll("--[^\n]*\n", "\n");
//            // Remove LOCK/UNLOCK TABLES
//            sql = sql.replaceAll("(?i)LOCK TABLES[^;]*;", "");
//            sql = sql.replaceAll("(?i)UNLOCK TABLES[^;]*;", "");
//            // Remove DROP TABLE statements (Hibernate already created tables)
//            sql = sql.replaceAll("(?i)DROP TABLE[^;]*;", "");
//            // Remove CREATE TABLE statements (Hibernate already created tables)
//            sql = sql.replaceAll("(?i)CREATE TABLE[\\s\\S]*?;", "");
//            // Convert _binary '\0' -> 0  and  _binary '\\1' -> 1
//            sql = sql.replaceAll("_binary '\\\\0'", "0");
//            sql = sql.replaceAll("_binary '\\\\1'", "1");
//            // Fallback: remove any remaining _binary prefix
//            sql = sql.replaceAll("_binary ", "");
//
//            for (String statement : sql.split(";")) {
//                String trimmed = statement.trim();
//                if (!trimmed.isEmpty()) {
//                    try {
//                        jdbcTemplate.execute(trimmed);
//                    } catch (Exception e) {
//                        System.err.println("Failed: " + trimmed.substring(0, Math.min(80, trimmed.length())));
//                        System.err.println("Reason: " + e.getMessage());
//                    }
//                }
//            }
//            System.out.println("Dump loaded successfully.");
//        } else {
//            System.out.println("Database already has data. Skipping...");
//        }
//    }
//}