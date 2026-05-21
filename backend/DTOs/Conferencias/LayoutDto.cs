using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace ConferenceManager.DTOs.Conferencias;

public class SaveLayoutRequest
{
    [Required]
    public string LayoutJson { get; set; } = null!;
}

public class LayoutResponse
{
    public string? LayoutJson { get; set; }
}
