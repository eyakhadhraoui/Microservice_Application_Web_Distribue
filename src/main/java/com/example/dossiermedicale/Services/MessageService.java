package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.DossierMedical;
import com.example.dossiermedicale.Entities.Message;
import com.example.dossiermedicale.Enum.TypeExpediteur;
import com.example.dossiermedicale.Repository.DossierMedicalRepository;
import com.example.dossiermedicale.Repository.MessageRepository;
import com.example.dossiermedicale.dto.MessageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final DossierMedicalRepository dossierMedicalRepository;

    private MessageDTO toDTO(Message m) {
        MessageDTO dto = new MessageDTO();
        dto.setIdMessage(m.getIdMessage());
        dto.setIdDossierMedical(m.getDossierMedical().getIdDossierMedical());
        dto.setTypeExpediteur(m.getTypeExpediteur());
        dto.setContenu(m.getContenu());
        dto.setDateEnvoi(m.getDateEnvoi());
        dto.setLu(m.getLu());
        dto.setExpediteurNom(m.getTypeExpediteur() == TypeExpediteur.MEDECIN ? "Médecin" : "Patient");
        return dto;
    }

    public MessageDTO send(MessageDTO dto) {
        DossierMedical dossier = dossierMedicalRepository.findById(dto.getIdDossierMedical())
                .orElseThrow(() -> new RuntimeException("Dossier médical non trouvé: " + dto.getIdDossierMedical()));
        Message m = new Message();
        m.setDossierMedical(dossier);
        m.setTypeExpediteur(dto.getTypeExpediteur());
        m.setContenu(dto.getContenu().trim());
        m.setDateEnvoi(java.time.LocalDateTime.now());
        m.setLu(false);
        return toDTO(messageRepository.save(m));
    }

    @Transactional(readOnly = true)
    public List<MessageDTO> getByDossier(Long idDossierMedical) {
        return messageRepository.findByDossierMedicalIdDossierMedicalOrderByDateEnvoiAsc(idDossierMedical)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void markAsLu(Long idMessage) {
        messageRepository.findById(idMessage).ifPresent(m -> {
            m.setLu(true);
            messageRepository.save(m);
        });
    }
}
