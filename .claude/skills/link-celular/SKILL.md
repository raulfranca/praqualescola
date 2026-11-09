---
name: link-celular
description: Gera o endereço exato para abrir no navegador do celular e testar o que está rodando na máquina. Só faz sentido em sessão local, não na nuvem. Use quando o usuário pedir o link para testar no celular, o IP da máquina para o telefone, ou disser que vai testar pelo celular.
---

# link-celular — o endereço para abrir no telefone

**Faz uma única coisa:** descobrir o endereço certo e entregá-lo num bloco de código, pronto para digitar no navegador do celular.

O IP da máquina vem de DHCP e muda a cada renovação de concessão, então não adianta o usuário guardar nos favoritos — por isso esta skill existe.

---

## Passo único

Leia as portas em `web.portas` de `.claude/loop.json` (cada item tem `porta`, `caminho` e `nome`) e ponha-as na lista `$alvos` abaixo. Rode na ferramenta `PowerShell`:

```powershell
$ip = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.PrefixLength -lt 32 -and
    $_.IPAddress -notlike '127.*' -and
    $_.InterfaceAlias -notmatch 'WSL|Hyper-V|Default Switch|Loopback|VirtualBox|VMware' -and
    ($_.IPAddress -like '10.*' -or $_.IPAddress -like '192.168.*' -or $_.IPAddress -match '^172\.(1[6-9]|2[0-9]|3[01])\.')
  } |
  Sort-Object -Property @{Expression={ if ($_.PrefixOrigin -eq 'Dhcp') { 0 } else { 1 } }} |
  Select-Object -First 1).IPAddress

if (-not $ip) { "SEM IP DE REDE LOCAL"; exit }
"IP: $ip"
$alvos = @(@{p=8080; c='/'})   # um item por entrada de web.portas
foreach ($alvo in $alvos) {
  $porta = $alvo.p
  $ouve = [bool](Get-NetTCPConnection -State Listen -LocalPort $porta -ErrorAction SilentlyContinue)
  if (-not $ouve) { "$porta : PARADO"; continue }
  $url = "http://${ip}:$porta$($alvo.c)"
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 4
    "$porta : OK $($r.StatusCode) -> $url"
  } catch {
    "$porta : ESCUTA MAS NAO RESPONDE NO IP DA LAN -> $url"
  }
}
```

Ele resolve as três coisas de uma vez: acha o IP da rede local (descartando adaptadores virtuais de WSL, Hyper-V e VPN, que não servem ao celular), vê qual servidor está no ar e **confirma com uma requisição de verdade** que ele responde naquele IP — não só em `127.0.0.1`.

---

## Qual porta entregar

- **Só uma no ar:** entregue essa.
- **Mais de uma no ar:** entregue todas, rotuladas pelo `nome`. Se o usuário disse o que vai testar, ponha em primeiro a que corresponde.

**Se a porta desejada estiver `PARADO`**, diga qual comando o usuário precisa rodar (`comandos.dev` de `.claude/loop.json`) e pare — não suba servidor por conta própria.

---

## Formato da entrega

O bloco de código com o endereço é a resposta. Sem preâmbulo, sem repetir o diagnóstico.

```
http://10.0.101.89:8080/
```

Com as duas no ar, um bloco por destino, cada um com um rótulo curto antes.

O IP do exemplo acima é ilustrativo — **use sempre o que o comando devolveu**, nunca um valor lembrado de outra sessão.

---

## Quando o celular não abre

Se o comando deu `OK` mas o telefone não carrega, o problema é de rede, não do servidor. Nessa ordem:

1. **Faixa diferente.** Peça o IP do celular (Ajustes → WiFi → toque na rede). Se os três primeiros números não baterem com os da máquina, o WiFi está em outra faixa e a rede provavelmente não deixa passar — não há ajuste local que resolva.
2. **Firewall.** Em rede de domínio o Firewall do Windows bloqueia a entrada por padrão. A regra abaixo abre a porta, mas **exige PowerShell como administrador e altera a segurança da máquina — apenas ofereça o comando, nunca o execute**:

```powershell
New-NetFirewallRule -DisplayName "Dev <porta>" -Direction Inbound -Protocol TCP -LocalPort <porta> -Profile Domain -Action Allow
```

Em máquina de domínio a política do órgão pode reverter a regra; nesse caso o caminho é o TI.
