package com.camposync.repository;

import com.camposync.entity.Invitacion;
import com.camposync.entity.Invitacion.EstadoInvitacion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvitacionRepository extends JpaRepository<Invitacion, String> {

    Optional<Invitacion> findByToken(String token);

    List<Invitacion> findByEmailInvitadoAndEstado(String emailInvitado, EstadoInvitacion estado);

    List<Invitacion> findByAsesoria_Id(Long asesoriaId);

    List<Invitacion> findByAsesoria_IdAndEstado(Long asesoriaId, EstadoInvitacion estado);
}
