package com.example.salesstock.service;

import com.example.salesstock.entity.Product;
import com.example.salesstock.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ProductDetailsImport {

    @Autowired
    private ProductRepository productRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Import products from CSV file with the specified columns
     */
    public ImportResult importFromCsv(MultipartFile file) {
        List<Product> products = new ArrayList<>();
        List<String> errors = new ArrayList<>();
        int successCount = 0;
        int lineNumber = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                lineNumber++;

                // Skip header row
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                try {
                    Product product = parseProductFromCsvLine(line, lineNumber);
                    if (product != null) {
                        products.add(product);
                        successCount++;
                    }
                } catch (Exception e) {
                    errors.add("Line " + lineNumber + ": " + e.getMessage());
                }

                // Save in batches
                if (products.size() >= 100) {
                    productRepository.saveAll(products);
                    products.clear();
                }
            }

            // Save remaining products
            if (!products.isEmpty()) {
                productRepository.saveAll(products);
            }

        } catch (IOException e) {
            errors.add("Failed to read file: " + e.getMessage());
        }

        return new ImportResult(successCount, errors);
    }

    /**
     * Parse a single CSV line into a Product object
     * Expected columns in order:
     * ID,RECORDNO,STOCKNO,PARTNO,MANUFACTUR,VENDOR,ACCOUNTNO,DESCRIPTION,CATAGORY,PACKAGESIZE,
     * PACKAGESIZEORDER,AMOUNTINSTOCK,MINAMOUNT,MAXAMOUNT,LOCATION,INVENTORYMARKUP,COST,RETAIL,
     * RETAIL2,RETAIL3,TAXABLE,GST,WEIGHT,BACKORDERDATE,BACKORDERED,AMOUNTBACKORDERED,
     * BACKORDERAMOUNT,PORDERNO,SPECIALITEM,ITEMPICTURE,PICTURE,SOLDHISTORY
     */
    private Product parseProductFromCsvLine(String line, int lineNumber) {
        // Handle quoted fields that might contain commas
        List<String> fields = parseCsvLine(line);

        if (fields.size() < 32) { // Expecting 32 columns
            throw new IllegalArgumentException("Invalid CSV format. Expected 32 columns, but found " + fields.size());
        }

        Product product = new Product();
        int index = 0;

        try {
            // ID (skip - auto-generated)
            index++; // Skip ID column

            // RECORDNO
            product.setRecordNo(getStringValue(fields, index++));

            // STOCKNO
            product.setStockNo(getStringValue(fields, index++));

            // PARTNO
            product.setPartNo(getStringValue(fields, index++));

            // MANUFACTUR
            product.setManufactur(getStringValue(fields, index++));

            // VENDOR
            product.setVendor(getStringValue(fields, index++));

            // ACCOUNTNO
            product.setAccountNo(getStringValue(fields, index++));

            // DESCRIPTION
            product.setDescription(getStringValue(fields, index++));

            // CATAGORY
            product.setCatagory(getStringValue(fields, index++));

            // PACKAGESIZE
            product.setPackageSize(getStringValue(fields, index++));

            // PACKAGESIZEORDER
            product.setPackageSizeOrder(getIntegerValue(fields, index++));

            // AMOUNTINSTOCK
            product.setAmountInStock(getIntegerValue(fields, index++));

            // MINAMOUNT
            product.setMinAmount(getIntegerValue(fields, index++));

            // MAXAMOUNT
            product.setMaxAmount(getIntegerValue(fields, index++));

            // LOCATION
            product.setLocation(getStringValue(fields, index++));

            // INVENTORYMARKUP
            product.setInventoryMarkup(getBigDecimalValue(fields, index++));

            // COST
            product.setCost(getBigDecimalValue(fields, index++));

            // RETAIL
            product.setRetail(getBigDecimalValue(fields, index++));

            // RETAIL2
            product.setRetail2(getBigDecimalValue(fields, index++));

            // RETAIL3
            product.setRetail3(getBigDecimalValue(fields, index++));

            // TAXABLE
            product.setTaxable(getBooleanValue(fields, index++));

            // GST
            product.setGst(getBigDecimalValue(fields, index++));

            // WEIGHT
            product.setWeight(getBigDecimalValue(fields, index++));

            // BACKORDERDATE
            product.setBackOrderDate(getDateValue(fields, index++));

            // BACKORDERED
            product.setBackOrdered(getBooleanValue(fields, index++));

            // AMOUNTBACKORDERED
            product.setAmountBackOrdered(getIntegerValue(fields, index++));

            // BACKORDERAMOUNT
            product.setBackOrderAmount(getIntegerValue(fields, index++));

            // PORDERNO
            product.setPOrderNo(getStringValue(fields, index++));

            // SPECIALITEM
            product.setSpecialItem(getBooleanValue(fields, index++));

            // ITEMPICTURE
            product.setItemPicture(getStringValue(fields, index++));

            // PICTURE
            product.setPicture(getStringValue(fields, index++));

            // SOLDHISTORY
            product.setSoldHistory(getStringValue(fields, index++));

        } catch (Exception e) {
            throw new IllegalArgumentException("Error parsing field at index " + index + ": " + e.getMessage());
        }

        return product;
    }

    /**
     * Parse a CSV line handling quoted fields
     */
    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder field = new StringBuilder();

        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(field.toString().trim());
                field = new StringBuilder();
            } else {
                field.append(c);
            }
        }
        result.add(field.toString().trim()); // Add last field

        return result;
    }

    // Helper methods for parsing different data types
    private String getStringValue(List<String> fields, int index) {
        String value = fields.get(index);
        return value.isEmpty() ? null : value;
    }

    private Integer getIntegerValue(List<String> fields, int index) {
        String value = fields.get(index);
        if (value == null || value.isEmpty()) return null;
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal getBigDecimalValue(List<String> fields, int index) {
        String value = fields.get(index);
        if (value == null || value.isEmpty()) return null;
        try {
            return new BigDecimal(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Boolean getBooleanValue(List<String> fields, int index) {
        String value = fields.get(index);
        if (value == null || value.isEmpty()) return null;
        value = value.toLowerCase().trim();
        return value.equals("1") || value.equals("true") || value.equals("yes") || value.equals("y");
    }

    private LocalDate getDateValue(List<String> fields, int index) {
        String value = fields.get(index);
        if (value == null || value.isEmpty()) return null;
        try {
            return LocalDate.parse(value, DATE_FORMATTER);
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Result class for import operation
     */
    public static class ImportResult {
        private final int successCount;
        private final List<String> errors;

        public ImportResult(int successCount, List<String> errors) {
            this.successCount = successCount;
            this.errors = errors;
        }

        public int getSuccessCount() {
            return successCount;
        }

        public List<String> getErrors() {
            return errors;
        }

        public boolean hasErrors() {
            return !errors.isEmpty();
        }

        @Override
        public String toString() {
            return String.format("Import completed: %d products imported successfully, %d errors",
                    successCount, errors.size());
        }
    }
}