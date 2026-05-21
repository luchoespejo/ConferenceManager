using System.ComponentModel.DataAnnotations;

namespace ConferenceManager.DTOs.Conferencias;

public class ConferenciaLayoutDto
{
    public Guid Id { get; set; }
    public Guid ConferenciaId { get; set; }
    public string Nombre { get; set; } = null!;
    public string LayoutJson { get; set; } = null!;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateLayoutTemplateRequest
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;

    [Required]
    public string LayoutJson { get; set; } = null!;
}

public class UpdateLayoutTemplateRequest
{
    [MaxLength(100)]
    public string? Nombre { get; set; }

    public string? LayoutJson { get; set; }
}

public class DuplicateLayoutRequest
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;
}
