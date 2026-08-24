package com.example.salesstock.controller;

import com.example.salesstock.entity.Product;
import com.example.salesstock.exception.BusinessException;
import com.example.salesstock.repository.ProductRepository;
import com.example.salesstock.service.ProductDetailsImport;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

//    @GetMapping
//    public List<Product> getAllProducts() {
//        return productRepository.findAll();
//    }

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        if (product.getAmountInStock() != null && product.getAmountInStock() < 0) {
            throw new BusinessException("Stock quantity cannot be negative");
        }
        if (product.getCost() != null && product.getCost().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Cost price cannot be negative");
        }
        if (product.getRetail() != null && product.getRetail().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Retail price cannot be negative");
        }
        // Ignore any client-supplied id/version so this endpoint can only ever create,
        // never overwrite an existing row by id collision.
        product.setId(null);
        product.setVersion(0L);
        return productRepository.save(product);
    }

    @GetMapping("/manufacturers")
    public List<String> getManufacturers() {
        return productRepository.findDistinctManufacturers();
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

    @GetMapping
    public Page<Product> getProducts(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(required = false) String manufactur,
            Pageable pageable
    ) {
        return productRepository.search(keyword, manufactur, pageable);
    }

    //Get products by verndor
    @GetMapping("/vendor/{vendor}")
    public List<Product> getProductsByVendor(@PathVariable String vendor) {
        return productRepository.findByVendor(vendor);
    }

}
