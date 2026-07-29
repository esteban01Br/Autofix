package com.autofix.service;

import com.autofix.dto.auth.LoginRequest;
import com.autofix.dto.auth.LoginResponse;
import com.autofix.dto.auth.RegisterRequest;

public interface AuthenticationService {

    LoginResponse login(LoginRequest request);

    LoginResponse register(RegisterRequest request);

}