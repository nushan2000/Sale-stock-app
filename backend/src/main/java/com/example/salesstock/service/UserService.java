package com.example.salesstock.service;

import com.example.salesstock.dto.UserDto;
import com.example.salesstock.entity.AppUser;
import com.example.salesstock.exception.BusinessException;
import com.example.salesstock.exception.ResourceNotFoundException;
import com.example.salesstock.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final AppUserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    public List<AppUser> getAll() {
        return userRepository.findAll(Sort.by("username"));
    }

    public AppUser create(UserDto dto) {
        if (dto.getPassword() == null || dto.getPassword().length() < 6) {
            throw new BusinessException("Password must be at least 6 characters");
        }
        userRepository.findByUsername(dto.getUsername()).ifPresent(u -> {
            throw new BusinessException("Username already exists");
        });
        userRepository.findByEmail(dto.getEmail()).ifPresent(u -> {
            throw new BusinessException("Email already exists");
        });

        AppUser user = new AppUser();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(bCryptPasswordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole() != null ? dto.getRole() : AppUser.Role.STAFF);
        user.setActive(true);
        return userRepository.save(user);
    }

    /** Updates role and/or active status. Guards against locking everyone out. */
    public AppUser updateRoleAndStatus(Long id, UserDto dto) {
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));

        boolean demotingOrDeactivating =
                (dto.getRole() == AppUser.Role.STAFF && user.getRole() == AppUser.Role.ADMIN)
                        || (Boolean.FALSE.equals(dto.getActive()) && Boolean.TRUE.equals(user.getActive()));

        if (demotingOrDeactivating && user.getRole() == AppUser.Role.ADMIN) {
            long otherActiveAdmins = userRepository.findAll().stream()
                    .filter(u -> !u.getId().equals(id))
                    .filter(u -> u.getRole() == AppUser.Role.ADMIN)
                    .filter(u -> Boolean.TRUE.equals(u.getActive()))
                    .count();
            if (otherActiveAdmins == 0) {
                throw new BusinessException("Cannot remove the last active admin");
            }
        }

        if (dto.getRole() != null) user.setRole(dto.getRole());
        if (dto.getActive() != null) user.setActive(dto.getActive());
        return userRepository.save(user);
    }
}
