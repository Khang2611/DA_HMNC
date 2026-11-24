package com.vinatrust.bank.identity.internal.application;

import com.vinatrust.bank.identity.contracts.IdentityQueryContract;
import com.vinatrust.bank.identity.contracts.dto.UserSummaryDto;
import com.vinatrust.bank.identity.internal.application.mapper.UserMapper;
import com.vinatrust.bank.identity.internal.domain.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class IdentityQueryContractImpl implements IdentityQueryContract {

    private final UserRepository userRepository;
    private final UserMapper userMapper;

    public IdentityQueryContractImpl(UserRepository userRepository, UserMapper userMapper) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
    }

    @Override
    public Optional<UserSummaryDto> findUserById(UUID userId) {
        return userRepository.findById(userId).map(userMapper::toUserSummaryDto);
    }

    @Override
    public Optional<UserSummaryDto> findUserByUsername(String username) {
        return userRepository.findByUsername(username).map(userMapper::toUserSummaryDto);
    }

    @Override
    public Optional<UserSummaryDto> findUserByPhone(String phone) {
        return userRepository.findByPhone(phone).map(userMapper::toUserSummaryDto);
    }

    @Override
    public boolean existsById(UUID userId) {
        return userRepository.findById(userId).isPresent();
    }
}

