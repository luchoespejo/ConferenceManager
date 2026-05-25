using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Salas;

public class CreateSalaDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string Nombre { get; set; } = null!;

    [Range(1, int.MaxValue, ErrorMessage = "La capacidad debe ser un entero positivo.")]
    public int? Capacidad { get; set; }
}
