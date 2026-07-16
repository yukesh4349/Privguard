import random

def check_ip_details(ip_address: str) -> dict:
    """
    Checks an IP address for Geo-Location and VPN/Proxy status.
    For the prototype, this uses intelligent simulation.
    """
    if ip_address in ["127.0.0.1", "::1", "localhost"]:
        return {
            "ip": ip_address,
            "country": "United States",
            "is_vpn": False,
            "is_proxy": False,
            "risk_score": 10.0
        }
    
    # Simulate external IPs
    is_vpn = random.choice([True, False, False, False]) # 25% chance of VPN
    is_foreign = random.choice([True, False, False]) # 33% chance of foreign country
    
    country = "Russia" if is_foreign else "United States"
    risk_score = 10.0
    
    if is_vpn:
        risk_score += 40.0
    if is_foreign:
        risk_score += 45.0
        
    return {
        "ip": ip_address,
        "country": country,
        "is_vpn": is_vpn,
        "is_proxy": is_vpn, # simplified
        "risk_score": risk_score
    }
