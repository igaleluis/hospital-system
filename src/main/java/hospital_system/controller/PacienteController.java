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
    @PutMapping("/{id}")
    public Paciente actualizar(@PathVariable Long id, @RequestBody Paciente paciente) {
        paciente.setId(id);
        return repository.save(paciente);
    }
    @PatchMapping("/{id}/status")
    public Paciente cambiarEstado(@PathVariable Long id, @RequestParam String estado) {
        Paciente p = repository.findById(id).orElseThrow();
        p.setEstado(estado);
        return repository.save(p);
    }
    @PutMapping("/reset")
    public void reset() {
        repository.findAll().forEach(p -> {
            p.setEstado("Esperando");
            repository.save(p);
        });
    }
}