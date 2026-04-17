package com.example.salesstock.service;

import com.example.salesstock.dto.CustomerDto;
import com.example.salesstock.dto.PagedResponse;
import com.example.salesstock.entity.Customer;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerService {

    private final CustomerRepository customerRepository;

    public PagedResponse<Customer> getAll(String search, int page, int size, String sort) {
        Sort s = Sort.by(Sort.Direction.ASC, sort.isEmpty() ? "name" : sort);
        Page<Customer> result = customerRepository.search(search, PageRequest.of(page, size, s));
        return new PagedResponse<>(result.getContent(), result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages(), result.isLast());
    }

    public List<Customer> getAll() {
        return customerRepository.findAll(Sort.by("name"));
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + id));
    }

    public Customer create(CustomerDto dto) {
        Customer c = new Customer();
        mapDtoToEntity(dto, c);
        return customerRepository.save(c);
    }

    public Customer update(Long id, CustomerDto dto) {
        Customer c = getById(id);
        mapDtoToEntity(dto, c);
        return customerRepository.save(c);
    }

    public void delete(Long id) {
        customerRepository.deleteById(id);
    }

    private void mapDtoToEntity(CustomerDto dto, Customer c) {
        c.setName(dto.getName());
        c.setPhone(dto.getPhone());
        c.setEmail(dto.getEmail());
        c.setAddress(dto.getAddress());
        c.setCreditLimit(dto.getCreditLimit());
        c.setNotes(dto.getNotes());
    }
}
