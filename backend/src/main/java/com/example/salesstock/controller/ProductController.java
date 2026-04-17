package com.example.salesstock.controller;

import com.example.salesstock.entity.Product;
import com.example.salesstock.repository.ProductRepository;
import com.example.salesstock.service.ProductDetailsImport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    @Autowired
    private ProductDetailsImport productImportService;

    @PostMapping("/import/csv")
    public ResponseEntity<?> importProductsFromCsv(@RequestParam("file") MultipartFile file) {
        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to upload");
        }

        // Check file type
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            return ResponseEntity.badRequest().body("Please upload a CSV file");
        }

        // Process the file
        ProductDetailsImport.ImportResult result = productImportService.importFromCsv(file);

        if (result.hasErrors()) {
            return ResponseEntity.ok(result);
        }

        return ResponseEntity.ok(result);
    }
}
