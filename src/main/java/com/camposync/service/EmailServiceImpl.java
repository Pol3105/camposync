package com.camposync.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    private static final String FROM    = "onboarding@resend.dev";
    private static final String BASE_URL = "http://localhost:5173";

    private final Resend resend;

    public EmailServiceImpl(@Value("${resend.api-key}") String apiKey) {
        this.resend = new Resend(apiKey);
    }

    @Override
    public void enviarCorreoInvitacion(String emailDestino, String token, String rolDestino) {
        boolean esAsesor = "ASESOR".equalsIgnoreCase(rolDestino);
        String rolLabel  = esAsesor ? "asesor" : "agricultor";
        String activationUrl = BASE_URL + "/register/invite/" + token;

        String subject = esAsesor
                ? "Has sido invitado a unirte como Asesor en Camposync"
                : "Has sido invitado a activar tu cuenta de Agricultor en Camposync";

        String html = buildHtml(activationUrl, rolLabel, esAsesor);

        CreateEmailOptions options = CreateEmailOptions.builder()
                .from(FROM)
                .to(emailDestino)
                .subject(subject)
                .html(html)
                .build();

        try {
            CreateEmailResponse response = resend.emails().send(options);
            log.info("Correo de invitación enviado a {} (id: {})", emailDestino, response.getId());
        } catch (ResendException e) {
            log.error("Error al enviar correo de invitación a {}: {}", emailDestino, e.getMessage());
            throw new RuntimeException("Fallo al enviar el correo de invitación", e);
        }
    }

    @Override
    public void enviarCorreoRecuperacion(String emailDestino, String token) {
        String resetUrl = BASE_URL + "/reset-password/" + token;

        CreateEmailOptions options = CreateEmailOptions.builder()
                .from(FROM)
                .to(emailDestino)
                .subject("Recuperación de contraseña - Camposync")
                .html(buildRecoveryHtml(resetUrl))
                .build();

        try {
            CreateEmailResponse response = resend.emails().send(options);
            log.info("Correo de recuperación enviado a {} (id: {})", emailDestino, response.getId());
        } catch (ResendException e) {
            log.error("Error al enviar correo de recuperación a {}: {}", emailDestino, e.getMessage());
            throw new RuntimeException("Fallo al enviar el correo de recuperación", e);
        }
    }

    private String buildRecoveryHtml(String resetUrl) {
        return """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;background:#f0f2f7;font-family:'Inter',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f2f7;padding:40px 20px;">
                    <tr><td align="center">
                      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

                        <tr><td style="height:5px;background:linear-gradient(90deg,#2e5c38,#4e9a5f);"></td></tr>

                        <tr><td style="padding:36px 44px 24px;text-align:center;">
                          <p style="margin:0 0 6px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Camposync</p>
                          <p style="margin:0;font-size:13px;color:#9ca3af;">Gestión agrícola profesional</p>
                        </td></tr>

                        <tr><td style="padding:0 44px 24px;text-align:center;">
                          <span style="display:inline-block;padding:6px 18px;background:#fff8ed;border:1.5px solid #fdd8a0;border-radius:24px;font-size:13px;font-weight:600;color:#c07010;">
                            🔑 Recuperación de contraseña
                          </span>
                        </td></tr>

                        <tr><td style="padding:0 44px 32px;">
                          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
                            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Camposync.
                          </p>
                          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.65;">
                            Haz clic en el botón para crear una nueva contraseña. El enlace es válido durante <strong>1 hora</strong>.
                            Si no realizaste esta solicitud, puedes ignorar este correo.
                          </p>

                          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr><td style="border-radius:12px;background:#e07030;">
                              <a href="%s" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                                Restablecer contraseña
                              </a>
                            </td></tr>
                          </table>
                        </td></tr>

                        <tr><td style="padding:0 44px;"><hr style="border:none;border-top:1px solid #eceef5;"/></td></tr>

                        <tr><td style="padding:20px 44px 32px;">
                          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Si el botón no funciona, copia este enlace:</p>
                          <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">%s</p>
                        </td></tr>

                        <tr><td style="padding:20px 44px 28px;background:#f7f8fc;text-align:center;">
                          <p style="margin:0;font-size:11.5px;color:#b0b8c0;line-height:1.8;">
                            Si no solicitaste este cambio, tu cuenta sigue siendo segura.<br/>
                            El enlace caduca automáticamente en 1 hora. © Camposync
                          </p>
                        </td></tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(resetUrl, resetUrl);
    }

    private String buildHtml(String activationUrl, String rolLabel, boolean esAsesor) {
        String accentColor  = esAsesor ? "#3b5bdb" : "#2e5c38";
        String accentLight  = esAsesor ? "#eef2ff" : "#f0faf3";
        String accentBorder = esAsesor ? "#c5cef8" : "#c8e8b0";
        String rolCapital   = esAsesor ? "Asesor" : "Agricultor";
        String descripcion  = esAsesor
                ? "Tu asesoría te ha invitado a unirte a Camposync como <strong>asesor</strong>. Podrás gestionar explotaciones, parcelas y validar tratamientos fitosanitarios."
                : "Tu asesoría te ha invitado a unirte a Camposync como <strong>agricultor</strong>. Podrás registrar tus tratamientos y gestionar tu cuaderno de campo digital.";

        return """
                <!DOCTYPE html>
                <html lang="es">
                <head>
                  <meta charset="UTF-8"/>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                </head>
                <body style="margin:0;padding:0;background:#f0f2f7;font-family:'Inter',Arial,sans-serif;">
                  <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f0f2f7;padding:40px 20px;">
                    <tr><td align="center">
                      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10);">

                        <!-- Header strip -->
                        <tr><td style="height:5px;background:linear-gradient(90deg,%s,%s);"></td></tr>

                        <!-- Logo + title -->
                        <tr><td style="padding:36px 44px 28px;text-align:center;">
                          <p style="margin:0 0 6px;font-size:26px;font-weight:800;color:#111827;letter-spacing:-0.5px;">Camposync</p>
                          <p style="margin:0;font-size:13px;color:#9ca3af;">Gestión agrícola profesional</p>
                        </td></tr>

                        <!-- Badge rol -->
                        <tr><td style="padding:0 44px 24px;text-align:center;">
                          <span style="display:inline-block;padding:6px 18px;background:%s;border:1.5px solid %s;border-radius:24px;font-size:13px;font-weight:600;color:%s;">
                            Invitación · %s
                          </span>
                        </td></tr>

                        <!-- Body -->
                        <tr><td style="padding:0 44px 32px;">
                          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">
                            %s
                          </p>
                          <p style="margin:0 0 28px;font-size:14px;color:#6b7280;line-height:1.65;">
                            Haz clic en el botón para crear tu cuenta. El enlace es válido durante <strong>7 días</strong>.
                          </p>

                          <!-- CTA button -->
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                            <tr><td style="border-radius:12px;background:%s;">
                              <a href="%s" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.2px;">
                                Activar mi cuenta
                              </a>
                            </td></tr>
                          </table>
                        </td></tr>

                        <!-- Divider -->
                        <tr><td style="padding:0 44px;"><hr style="border:none;border-top:1px solid #eceef5;"/></td></tr>

                        <!-- URL fallback -->
                        <tr><td style="padding:20px 44px 32px;">
                          <p style="margin:0 0 8px;font-size:12px;color:#9ca3af;">Si el botón no funciona, copia este enlace:</p>
                          <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">%s</p>
                        </td></tr>

                        <!-- Footer -->
                        <tr><td style="padding:20px 44px 28px;background:#f7f8fc;text-align:center;">
                          <p style="margin:0;font-size:11.5px;color:#b0b8c0;line-height:1.8;">
                            Si no esperabas esta invitación, puedes ignorar este correo.<br/>
                            Caduca automáticamente en 7 días. © Camposync
                          </p>
                        </td></tr>

                      </table>
                    </td></tr>
                  </table>
                </body>
                </html>
                """.formatted(
                accentColor, accentColor,
                accentLight, accentBorder, accentColor, rolCapital,
                descripcion,
                accentColor, activationUrl,
                activationUrl
        );
    }
}
