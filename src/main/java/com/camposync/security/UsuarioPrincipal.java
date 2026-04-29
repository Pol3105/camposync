package com.camposync.security;

import com.camposync.entity.Asesor;
import com.camposync.entity.Usuario;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UsuarioPrincipal implements UserDetails {

    @Getter
    private final Usuario usuario;

    public UsuarioPrincipal(Usuario usuario) {
        this.usuario = usuario;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String role = (usuario instanceof Asesor) ? "ROLE_ASESOR" : "ROLE_GRANJERO";
        return List.of(new SimpleGrantedAuthority(role));
    }

    @Override
    public String getPassword() {
        return usuario.getPasswd();
    }

    @Override
    public String getUsername() {
        return usuario.getUsername();
    }
}
