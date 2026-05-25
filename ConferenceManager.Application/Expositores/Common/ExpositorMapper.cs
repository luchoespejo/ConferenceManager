using System.Text.Json;
using ConferenceManager.DTOs.Expositores;
using ConferenceManager.Models;

namespace ConferenceManager.Application.Expositores.Common;

public static class ExpositorMapper
{
    public static ExpositorDetalleDto MapToDetalle(Expositor e)
    {
        Dictionary<string, string>? redesSociales = null;
        if (e.RedesSociales != null)
        {
            try { redesSociales = JsonSerializer.Deserialize<Dictionary<string, string>>(e.RedesSociales.RootElement.GetRawText()); }
            catch (JsonException) { }
        }

        return new ExpositorDetalleDto
        {
            Id = e.Id,
            ConferenciaId = e.ConferenciaId,
            Nombre = e.Nombre,
            Bio = e.Bio,
            FotoUrl = e.FotoUrl,
            Email = e.Email,
            RedesSociales = redesSociales,
            TokenAcceso = e.TokenAcceso
        };
    }
}
