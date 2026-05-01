using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Salas;

public class UpdateSalaDto
{
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string? Nombre { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La capacidad debe ser un entero positivo.")]
    public int? Capacidad { get; set; }
}
