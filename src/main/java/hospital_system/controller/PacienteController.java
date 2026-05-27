package hospital_system.controller;

import hospital_system.model.Paciente;
import hospital_system.repository.PacienteRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
@CrossOrigin("*")
public class PacienteController {

    @Autowired
    private PacienteRepository repository;

    @GetMapping
    public List<Paciente> obtenerPacientes() {
        return repository.findAll();
    }

    @PostMapping
    public Paciente guardarPaciente(@RequestBody Paciente paciente) {
        return repository.save(paciente);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}