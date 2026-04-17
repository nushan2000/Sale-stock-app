package com.example.salesstock.controller;

import com.example.salesstock.dto.InvoiceDto;
import com.example.salesstock.dto.InvoiceItemDto;
import com.example.salesstock.entity.Customer;
import com.example.salesstock.entity.Invoice;
import com.example.salesstock.repository.CustomerRepository;
import com.example.salesstock.service.InvoiceService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sales")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class QuickSaleController {

    private final InvoiceService invoiceService;
    private final CustomerRepository customerRepository;

    @PostMapping
    public ResponseEntity<?> createQuickSale(@RequestBody QuickSaleRequest request) {
        // Find or create default "Walk-in Customer"
        Customer customer = customerRepository.findAll().stream()
                .filter(c -> c.getName() != null && c.getName().equalsIgnoreCase("Walk-in Customer"))
                .findFirst()
                .orElseGet(() -> {
                    Customer newCustomer = new Customer();
                    newCustomer.setName("Walk-in Customer");
                    newCustomer.setPhone("N/A");
                    newCustomer.setEmail("N/A");
                    newCustomer.setAddress("N/A");
                    return customerRepository.save(newCustomer);
                });

        InvoiceDto dto = new InvoiceDto();
        dto.setCustomerId(customer.getId());
        dto.setInvoiceDate(LocalDate.now());
        dto.setPaymentType(Invoice.PaymentType.CASH);
        dto.setNotes("Quick Sale POS");

        List<InvoiceItemDto> itemDtos = request.getItems().stream().map(cartItem -> {
            InvoiceItemDto itemDto = new InvoiceItemDto();
            itemDto.setProductId(cartItem.getProduct().getId());
            itemDto.setQuantity(cartItem.getQuantity());
            itemDto.setUnitPrice(BigDecimal.valueOf(cartItem.getUnitPrice()));
            itemDto.setDiscount(BigDecimal.ZERO);
            itemDto.setTax(BigDecimal.ZERO);
            return itemDto;
        }).collect(Collectors.toList());

        dto.setItems(itemDtos);

        // Calculate total to mark as fully paid
        BigDecimal total = request.getItems().stream()
                .map(item -> BigDecimal.valueOf(item.getUnitPrice()).multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        dto.setPaidAmount(total);

        Invoice savedInvoice = invoiceService.create(dto);
        return ResponseEntity.ok(savedInvoice);
    }
}

@Data
class QuickSaleRequest {
    private List<CartItem> items;
}

@Data
class CartItem {
    private ProductSummary product;
    private int quantity;
    private double unitPrice;
}

@Data
class ProductSummary {
    private Long id;
    private String description;
}
