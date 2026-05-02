using ConferenceManager.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConferenceManager.Controllers;

[ApiController]
[Route("api/public/{slug}/certificado")]
public class CertificadoController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCertificado(string slug, [FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { error = "EMAIL_REQUIRED", message = "El email es requerido." });

        var conferencia = await context.Conferencias
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (conferencia is null)
            return NotFound(new { error = "CONFERENCIA_NOT_FOUND" });

        var participante = await context.Participantes
            .AsNoTracking()
            .FirstOrDefaultAsync(p =>
                p.ConferenciaId == conferencia.Id &&
                p.Email.ToLower() == email.ToLower().Trim() &&
                p.PuedeGenerarCertificado);

        if (participante is null)
            return NotFound(new { error = "PARTICIPANTE_NOT_FOUND", message = "No se encontró un participante con ese email o no está habilitado para generar certificado." });

        var html = GenerateCertificateHtml(participante.Nombre, conferencia.Nombre,
            conferencia.FechaInicio.ToString("dd/MM/yyyy"), conferencia.FechaFin.ToString("dd/MM/yyyy"),
            conferencia.ColorPrimario ?? "#1a1a2e");

        return Content(html, "text/html");
    }

    private static string GenerateCertificateHtml(string nombre, string congreso, string fechaInicio, string fechaFin, string colorPrimario)
    {
        return $"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Certificado de Participación</title>
          <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{ font-family: Georgia, 'Times New Roman', serif; background: #f5f5f0; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem; }}
            .cert {{ background: #fff; width: 794px; min-height: 562px; padding: 60px 70px; border: 3px solid {colorPrimario}; box-shadow: 0 4px 30px rgba(0,0,0,.15); position: relative; text-align: center; }}
            .cert::before {{ content: ''; position: absolute; inset: 10px; border: 1px solid {colorPrimario}44; pointer-events: none; }}
            .header {{ color: {colorPrimario}; font-size: 13px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 30px; }}
            .title {{ font-size: 42px; font-weight: 700; color: {colorPrimario}; margin-bottom: 20px; letter-spacing: 1px; }}
            .subtitle {{ font-size: 16px; color: #555; margin-bottom: 40px; }}
            .recipient-label {{ font-size: 13px; color: #888; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }}
            .recipient {{ font-size: 36px; font-weight: 700; color: #1a1a1a; border-bottom: 2px solid {colorPrimario}; display: inline-block; padding-bottom: 6px; margin-bottom: 40px; min-width: 300px; }}
            .body-text {{ font-size: 16px; color: #444; line-height: 1.8; margin-bottom: 16px; }}
            .event-name {{ font-size: 22px; font-weight: 700; color: {colorPrimario}; }}
            .dates {{ font-size: 14px; color: #666; margin-top: 8px; }}
            .footer {{ margin-top: 50px; font-size: 12px; color: #aaa; }}
            .print-btn {{ position: fixed; top: 20px; right: 20px; background: {colorPrimario}; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; z-index: 100; }}
            @media print {{ .print-btn {{ display: none; }} body {{ background: #fff; padding: 0; }} .cert {{ box-shadow: none; }} }}
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
          <div class="cert">
            <div class="header">Certificado de Participación</div>
            <div class="title">CERTIFICADO</div>
            <div class="subtitle">Se certifica que</div>
            <div class="recipient-label">Nombre del participante</div>
            <div class="recipient">{System.Net.WebUtility.HtmlEncode(nombre)}</div>
            <div class="body-text">participó en el evento</div>
            <div class="event-name">{System.Net.WebUtility.HtmlEncode(congreso)}</div>
            <div class="dates">Realizado del {fechaInicio} al {fechaFin}</div>
            <div class="footer">
              Este certificado fue generado digitalmente.
            </div>
          </div>
        </body>
        </html>
        """;
    }
}
