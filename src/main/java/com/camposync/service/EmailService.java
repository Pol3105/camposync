package com.camposync.service;

public interface EmailService {

    /**
     * Envía el correo de invitación al destinatario.
     *
     * @param emailDestino correo del invitado
     * @param token        token único de la invitación
     * @param rolDestino   "ASESOR" o "AGRICULTOR"
     */
    void enviarCorreoInvitacion(String emailDestino, String token, String rolDestino);

    /**
     * Envía el correo de recuperación de contraseña.
     *
     * @param emailDestino correo del usuario
     * @param token        token único de recuperación (válido 1 hora)
     */
    void enviarCorreoRecuperacion(String emailDestino, String token);
}
