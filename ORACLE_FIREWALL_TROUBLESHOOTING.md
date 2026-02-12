# Oracle Cloud Firewall Troubleshooting Summary

**Date:** February 12, 2026
**Server:** clash-wars-server (Oracle Cloud Free Tier)
**Public IP:** 129.151.219.17
**Issue:** Cannot access server ports from external internet despite correct configuration

---

## What Works ✅

- Server is running and operational
- SSH access works (port 22)
- Server listens on all interfaces (*:3000, *:8080)
- Outbound connectivity works (can curl google.com)
- Internal access works (localhost:3000 works)
- Application functions correctly
- API polling successful
- PM2 auto-restart configured

---

## What Doesn't Work ❌

- External access to port 3000: Connection refused/timeout
- External access to port 8080: Connection refused/timeout
- Cannot connect from outside to any custom ports

---

## Configuration Verified ✅

### 1. Virtual Cloud Network (VCN)
- **Name:** clash-wars-vcn
- **CIDR:** 10.0.0.0/16
- **Status:** Available
- **DNS:** Enabled

### 2. Subnet
- **Name:** public-subnet
- **Type:** Public (Regional)
- **CIDR:** 10.0.0.0/24
- **Route Table:** Default Route Table for clash-wars-vcn

### 3. Internet Gateway
- **Name:** internet-gateway
- **Status:** Available
- **Attached to VCN:** clash-wars-vcn

### 4. Route Table
- **Name:** Default Route Table for clash-wars-vcn
- **Route Rule:**
  - Destination: 0.0.0.0/0
  - Target: Internet Gateway (internet-gateway)
  - Description: Route to internet

### 5. Security List
- **Name:** Default Security List for clash-wars-vcn

**Ingress Rules:**
| Source | Protocol | Source Port | Dest Port | Description |
|--------|----------|-------------|-----------|-------------|
| 0.0.0.0/0 | TCP | All | 22 | SSH (WORKS) |
| 0.0.0.0/0 | TCP | All | 3000 | App (BLOCKED) |
| 0.0.0.0/0 | TCP | All | 8080 | App (BLOCKED) |
| 0.0.0.0/0 | ICMP | - | 3,4 | ICMP |
| 10.0.0.0/16 | ICMP | - | 3 | ICMP |

**Egress Rules:**
| Destination | Protocol | Description |
|-------------|----------|-------------|
| 0.0.0.0/0 | All | All traffic allowed |

### 6. Network Security Group (NSG)
- **Name:** clash-wars-nsg
- **Attached to VNIC:** clash-wars-vnic

**NSG Rules:**
| Direction | Source | Protocol | Dest Port |
|-----------|--------|----------|-----------|
| Ingress | 0.0.0.0/0 | TCP | 3000 |

### 7. Instance Configuration
- **Name:** clash-wars-server
- **Shape:** VM.Standard.E2.1.Micro (Always Free)
- **Image:** Ubuntu 22.04
- **VNIC:** clash-wars-vnic
- **Subnet:** public-subnet
- **Public IP:** 129.151.219.17
- **Private IP:** 10.0.0.82

### 8. Server Configuration
- **Node.js:** v18.20.8
- **Server listening:** *:3000 (verified with ss -tlnp)
- **UFW status:** inactive (Ubuntu firewall disabled)
- **Application:** Running via PM2

---

## Troubleshooting Steps Attempted

### 1. Security List Configuration
- ✅ Added ingress rule for port 3000 (Source: 0.0.0.0/0, TCP)
- ✅ Added ingress rule for port 8080 (Source: 0.0.0.0/0, TCP)
- ✅ Verified egress rules allow all outbound traffic
- ✅ Verified no stateful blocking

### 2. Network Security Groups
- ✅ Created NSG with ingress rule for port 3000
- ✅ Attached NSG to instance VNIC
- ❌ Still blocked

### 3. Server Configuration
- ✅ Verified server binds to 0.0.0.0 (all interfaces), not just 127.0.0.1
- ✅ Confirmed with: `sudo ss -tlnp | grep 3000` → Shows `*:3000`
- ✅ Verified UFW is inactive: `sudo ufw status` → inactive
- ✅ Tested multiple ports (3000, 8080)
- ✅ Restarted server multiple times
- ✅ Tested with both PM2 and direct node execution

### 4. Instance & Networking
- ✅ Rebooted instance
- ✅ Verified instance is in public subnet
- ✅ Verified subnet uses correct route table
- ✅ Verified route table points to internet gateway
- ✅ Verified internet gateway is "Available" and attached
- ✅ Verified no NSGs blocking (initially none, then added one explicitly)
- ✅ Verified subnet type is "Public (Regional)"

### 5. Connectivity Tests
- ✅ Internal access works: `curl http://localhost:3000` → SUCCESS
- ✅ Outbound works: `curl https://google.com` → SUCCESS
- ❌ Public IP from server fails: `curl http://129.151.219.17:3000` → "No route to host"
- ❌ Public IP from external: Browser timeout/connection refused
- ❌ Public IP from Windows: `curl http://129.151.219.17:3000` → "Unable to connect"

### 6. Port Testing
- ✅ Port 22 (SSH): Works perfectly ← Proves firewall CAN allow traffic
- ❌ Port 3000: Blocked
- ❌ Port 8080: Blocked

---

## Error Messages Observed

From server trying to reach itself:
```
curl: (7) Failed to connect to 129.151.219.17 port 3000: No route to host
```

From external (Windows):
```
curl: Unable to connect to the remote server
```

From browser:
- Connection timeout (first attempts)
- Connection refused (after reboot)

---

## Current Working Solution

**Cloudflare Tunnel** (bypasses all Oracle firewall issues):
- Public URL: https://pictures-feels-hall-maryland.trycloudflare.com
- Status: WORKING ✅
- Anyone can access without SSH
- Free service
- Auto-starts with PM2

---

## Theories About Why Oracle Firewall Failed

1. **Free Tier Restrictions:** Oracle Cloud Free Tier may have undocumented port restrictions
2. **Regional Policies:** EU-Stockholm-1 region may have additional firewall policies
3. **Account-Level Restrictions:** New accounts may have limitations
4. **VCN Creation Method:** Manually created VCN vs Wizard-created may have differences
5. **Stateful Firewall Bug:** Oracle's stateful firewall may have a bug preventing new rules
6. **DDoS Protection:** Oracle may be silently blocking traffic they consider suspicious

---

## What Oracle Support Would Need

If contacting Oracle Support, provide:
- Instance OCID: ocid1.instance.oc1.eu-stockholm-1.[your-ocid]
- VCN OCID: ocid1.vcn.oc1.eu-stockholm-1.amaaaaaaflq4u3yapbcteaqzl2cgiqg22opjutwinvlnddb2jlgw65coo6ia
- Subnet OCID: [from subnet details]
- Issue: Ingress traffic to custom ports blocked despite correct security list and NSG configuration
- Ports affected: 3000, 8080
- Port working: 22 (SSH)
- Evidence: Server listening on *:port, outbound works, ingress blocked

---

## Next Steps to Try (If Continuing to Debug)

1. **Try port 80 or 443** (standard HTTP/HTTPS ports) - may have special handling
2. **Re-create entire VCN using Wizard** ("Create VCN with Internet Connectivity")
3. **Try different Oracle Cloud region** (e.g., US instead of EU)
4. **Contact Oracle Support** with above information
5. **Check Oracle Cloud Free Tier documentation** for port restrictions
6. **Try Oracle Cloud Terraform** - infrastructure as code may work better
7. **Check Oracle Cloud Console for any warnings/alerts** we may have missed

---

## Recommendations

### For Production Use:
1. **Use Cloudflare Tunnel** - Free, reliable, bypasses all issues ✅ (CURRENT SOLUTION)
2. **OR Switch to DigitalOcean** - $6/month, networking "just works"
3. **OR Use Oracle with Cloudflare Tunnel** - Best of both worlds (free hosting + working firewall)

### For Debugging Oracle:
- Contact Oracle Support
- Try different region
- Re-create VCN with wizard
- Check Oracle Cloud documentation for Free Tier limitations

---

## Files Created for Access

**Working Solution (Cloudflare Tunnel):**
- Tunnel runs via PM2: `pm2 list` shows "tunnel" process
- Auto-starts on reboot
- Public URL changes on each cloudflared restart (quick tunnel)
- For permanent URL: Sign up for Cloudflare account and create Named Tunnel

**Alternative Access (SSH Tunnel):**
- `connect.bat` - Connects via SSH tunnel
- Access at http://localhost:3000 while connected
- Works but requires SSH access

---

## Summary

**Oracle Cloud configuration is 100% correct by all standard documentation, but external access to custom ports remains blocked. Port 22 (SSH) works, proving the instance is reachable, but ports 3000 and 8080 are blocked despite identical security list and NSG configuration.**

**Current workaround (Cloudflare Tunnel) provides full public access and is recommended for production use.**

---

## Resources

- Oracle Cloud Networking: https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/overview.htm
- Security Lists: https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/securitylists.htm
- Network Security Groups: https://docs.oracle.com/en-us/iaas/Content/Network/Concepts/networksecuritygroups.htm
- Cloudflare Tunnel: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps

---

**Created:** February 12, 2026
**Oracle Cloud Instance:** clash-wars-server
**Status:** Deployed and working via Cloudflare Tunnel ✅
