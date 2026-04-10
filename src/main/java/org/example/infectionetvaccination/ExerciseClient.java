package org.example.infectionetvaccination;

import org.example.infectionetvaccination.DTO.Exercise;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.List;

@FeignClient(
        name = "exercises",
        url = "http://localhost:8083"
)
public interface ExerciseClient {

    @GetMapping("/exercises")
    List<Exercise> getAllExercises();

    @GetMapping("/exercises/{id}")
    Exercise getExerciseById(@PathVariable("id") long id);
}