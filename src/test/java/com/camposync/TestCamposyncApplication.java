package com.camposync;

import org.springframework.boot.SpringApplication;

public class TestCamposyncApplication {

	public static void main(String[] args) {
		SpringApplication.from(CamposyncApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
