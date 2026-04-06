package com.example.dossiermedicale.Services;

import com.example.dossiermedicale.Entities.AlerteLabo;
import com.example.dossiermedicale.Enum.TypeAlerteLabo;
import com.example.dossiermedicale.Repository.AlerteLaboRepository;
import com.example.dossiermedicale.dto.AlerteLaboDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AlerteLaboService {

    private final AlerteLaboRepository alerteLaboRepository;
    private final ModuleLaboService moduleLaboService;

    private AlerteLaboDTO toDTO(AlerteLabo e) {
        AlerteLaboDTO dto = new AlerteLaboDTO();
        dto.setId(e.getId());
        dto.setResultatId(e.getResultatId());
        dto.setTypeAlerte(e.getTypeAlerte());
        dto.setMessage(e.getMessage());
        dto.setAcquitteePar(e.getAcquitteePar());
        dto.setDateAcquittement(e.getDateAcquittement());
        dto.setActionRealisee(e.getActionRealisee());
        return dto;
    }

    public void acquitter(Long alerteId, Long medecinId, String actionRealisee) {
        moduleLaboService.acquitterAlerte(alerteId, medecinId, actionRealisee);
    }

    @Transactional(readOnly = true)
    public List<AlerteLaboDTO> getByResultat(Long resultatId) {
        return alerteLaboRepository.findByResultatIdOrderByIdDesc(resultatId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AlerteLaboDTO> getNonAcquittees() {
        return alerteLaboRepository.findByAcquitteeParIsNull().stream().map(this::toDTO).collect(Collectors.toList());
    }
}
