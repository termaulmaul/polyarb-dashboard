# Security Best Practices

## Overview

Security is paramount in trading applications. PolyArb implements multiple layers of security to protect user funds and data.

## Core Security Principles

### 1. Defense in Depth
- Multiple security layers
- Fail-safe defaults
- Zero-trust architecture
- Least privilege access

### 2. Secure by Design
- Security considerations in every component
- Threat modeling during development
- Regular security reviews
- Automated security testing

## Credential Security

### Private Key Protection

#### Storage
```python
# NEVER store private keys in plain text
# Use environment variables or secure vaults
import os
from cryptography.fernet import Fernet

class SecureWallet:
    def __init__(self):
        self.key = os.getenv('ENCRYPTION_KEY')
        self.cipher = Fernet(self.key)

    def encrypt_private_key(self, private_key: str) -> str:
        return self.cipher.encrypt(private_key.encode()).decode()

    def decrypt_private_key(self, encrypted_key: str) -> str:
        return self.cipher.decrypt(encrypted_key.encode()).decode()
```

#### Access Control
- Private keys never logged
- Memory cleared after use
- No persistent storage of decrypted keys
- Hardware security module (HSM) support

### API Credentials

#### Polymarket API Security
```python
API_SECURITY_CONFIG = {
    'key_rotation': '30 days',
    'rate_limiting': '100 requests/minute',
    'ip_whitelisting': True,
    'request_signing': True
}
```

#### Environment Variable Security
```bash
# .env file permissions
chmod 600 .env

# Never commit .env files
echo ".env" >> .gitignore
```

## Network Security

### API Communication

#### HTTPS Everywhere
```javascript
// Force HTTPS in production
const httpsConfig = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert'),
  secureProtocol: 'TLSv1_2_method'
};
```

#### Request Validation
```python
from flask import request
from werkzeug.exceptions import BadRequest

def validate_api_request():
    # Rate limiting
    if not check_rate_limit(request.remote_addr):
        return {'error': 'Rate limit exceeded'}, 429

    # Input sanitization
    if not validate_input(request.json):
        return {'error': 'Invalid input'}, 400

    # Request signing verification
    if not verify_signature(request):
        return {'error': 'Invalid signature'}, 401
```

### WebSocket Security

#### Connection Authentication
```javascript
const wsConfig = {
  verifyClient: (info, callback) => {
    const token = info.req.headers.authorization;
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      callback(!err, decoded);
    });
  }
};
```

#### Message Encryption
```javascript
// Encrypt sensitive WebSocket messages
const encryptedMessage = encrypt(JSON.stringify({
  type: 'trade_execution',
  amount: 100,
  price: 0.65
}));
```

## Application Security

### Input Validation

#### Frontend Validation
```typescript
interface TradeRequest {
  amount: number;
  price: number;
  market: string;
}

const validateTradeRequest = (req: TradeRequest): boolean => {
  return (
    req.amount > 0 &&
    req.amount <= MAX_TRADE_SIZE &&
    req.price > 0 &&
    req.price <= 1 &&
    isValidMarket(req.market)
  );
};
```

#### Backend Validation
```python
def validate_trade_parameters(amount: float, price: float, market: str):
    """Comprehensive trade parameter validation"""
    if not (0 < amount <= MAX_POSITION_SIZE):
        raise ValueError("Invalid trade amount")

    if not (0 < price <= 1):
        raise ValueError("Invalid price range")

    if not is_valid_market(market):
        raise ValueError("Invalid market")

    # Additional security checks
    if detect_suspicious_pattern(amount, price):
        raise SecurityError("Suspicious trade pattern detected")
```

### SQL Injection Prevention

#### Parameterized Queries
```python
# ✅ Safe parameterized query
cursor.execute(
    "SELECT * FROM trades WHERE user_id = ? AND status = ?",
    (user_id, status)
)

# ❌ Dangerous string concatenation
# cursor.execute(f"SELECT * FROM trades WHERE user_id = {user_id}")
```

### XSS Protection

#### Frontend Sanitization
```typescript
import DOMPurify from 'dompurify';

// Sanitize user input before rendering
const safeHTML = DOMPurify.sanitize(userInput);
```

#### Content Security Policy
```html
<!-- CSP Header -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
">
```

## Risk Management Security

### Position Safety

#### Hedged Position Enforcement
```python
def validate_position_safety(positions: List[Position]):
    """Ensure all positions are properly hedged"""
    total_exposure = sum(pos.side * pos.amount for pos in positions)

    if abs(total_exposure) > MAX_UNHEDGED_EXPOSURE:
        raise RiskError("Unhedged position detected")

    return True
```

#### Emergency Stop Mechanisms
```python
class EmergencyStop:
    def __init__(self):
        self.triggers = {
            'daily_loss': -50.0,
            'max_drawdown': -100.0,
            'error_rate': 0.1,  # 10%
            'timeout_rate': 0.05  # 5%
        }

    def check_triggers(self, metrics: TradingMetrics):
        for trigger, threshold in self.triggers.items():
            if getattr(metrics, trigger) >= threshold:
                self.activate_emergency_stop(trigger)
                break
```

### Trade Validation

#### Pre-Trade Checks
```python
def pre_trade_validation(trade: Trade):
    """Comprehensive pre-trade validation"""
    checks = [
        validate_wallet_balance(trade.amount),
        validate_market_liquidity(trade.market),
        validate_price_reasonableness(trade.price),
        validate_position_limits(trade),
        validate_rate_limits(trade.user_id)
    ]

    if not all(checks):
        raise ValidationError("Pre-trade validation failed")

    return True
```

## Infrastructure Security

### Container Security

#### Docker Security Best Practices
```dockerfile
# Use official base images
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Install dependencies securely
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Use read-only filesystem where possible
VOLUME ["/tmp", "/app/logs"]

USER nextjs
```

#### Image Scanning
```bash
# Scan for vulnerabilities
docker scan polyarb-backend
trivy image polyarb-backend
```

### Server Security

#### Firewall Configuration
```bash
# UFW rules for PolyArb
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 8080/tcp  # Frontend
ufw allow 3001/tcp  # Backend API
ufw enable
```

#### SSH Hardening
```bash
# Disable password authentication
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Use key-based authentication only
# Disable root login
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

systemctl restart sshd
```

## Monitoring and Auditing

### Security Event Logging

#### Audit Trail
```python
class SecurityAuditor:
    def log_security_event(self, event_type: str, details: dict):
        """Log all security-related events"""
        audit_entry = {
            'timestamp': datetime.utcnow(),
            'event_type': event_type,
            'user_id': details.get('user_id'),
            'ip_address': details.get('ip'),
            'action': details.get('action'),
            'result': details.get('result'),
            'severity': self.calculate_severity(event_type)
        }

        # Write to secure audit log
        self.write_to_audit_log(audit_entry)

        # Alert on high-severity events
        if audit_entry['severity'] >= 4:
            self.send_security_alert(audit_entry)
```

#### Security Metrics
- Failed authentication attempts
- Unusual trading patterns
- API abuse detection
- Configuration changes

### Intrusion Detection

#### Log Analysis
```bash
# Monitor for suspicious patterns
tail -f /var/log/polyarb/security.log | grep -E "(FAILED_LOGIN|UNAUTHORIZED|SUSPICIOUS)"

# Automated alerting
logwatch --service polyarb --alert
```

#### Anomaly Detection
```python
class AnomalyDetector:
    def detect_anomalies(self, metrics: SystemMetrics):
        """Detect unusual system behavior"""
        anomalies = []

        # Check for unusual trading volumes
        if metrics.trade_volume > self.baseline_volume * 3:
            anomalies.append('unusual_volume')

        # Check for rapid configuration changes
        if metrics.config_changes > 5:
            anomalies.append('config_abuse')

        # Check for geographic anomalies
        if self.is_unusual_location(metrics.ip_address):
            anomalies.append('location_anomaly')

        return anomalies
```

## Incident Response

### Security Incident Process

1. **Detection**: Security monitoring alerts
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Investigation**: Gather evidence and logs
5. **Recovery**: Restore systems securely
6. **Lessons Learned**: Update security measures

### Breach Response Plan

#### Immediate Actions
- Disconnect affected systems
- Preserve evidence (don't delete logs)
- Notify security team
- Assess data exposure
- Communicate with stakeholders

#### Recovery Steps
- Restore from clean backups
- Rotate all credentials
- Update security patches
- Monitor for further compromise
- Document incident details

## Compliance and Regulations

### Data Protection

#### GDPR Compliance
```python
class DataController:
    def handle_data_deletion(self, user_id: str):
        """GDPR right to erasure"""
        # Delete user data
        self.delete_user_trades(user_id)
        self.delete_user_logs(user_id)
        self.delete_user_config(user_id)

        # Log deletion event
        self.audit_log('DATA_DELETION', {'user_id': user_id})
```

#### Data Encryption
```python
class DataEncryptor:
    def encrypt_sensitive_data(self, data: str) -> str:
        """Encrypt sensitive user data"""
        key = self.generate_encryption_key()
        cipher = AES.new(key, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(data.encode())
        return b64encode(cipher.nonce + tag + ciphertext).decode()

    def decrypt_sensitive_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive user data"""
        data = b64decode(encrypted_data)
        nonce, tag, ciphertext = data[:16], data[16:32], data[32:]
        cipher = AES.new(self.key, AES.MODE_GCM, nonce)
        return cipher.decrypt_and_verify(ciphertext, tag).decode()
```

## Security Testing

### Penetration Testing

#### Automated Security Scanning
```bash
# OWASP ZAP scan
zap.sh -cmd -quickurl http://localhost:8080 -quickout report.html

# SQLMap for API testing
sqlmap -u "http://localhost:3001/api/trades" --batch

# Nikto web server scanner
nikto -h localhost:8080
```

#### Manual Security Testing
- Authentication bypass attempts
- Input validation testing
- Session management review
- Access control verification
- Cryptographic strength assessment

### Security Code Review

#### Code Review Checklist
- [ ] Input validation on all user inputs
- [ ] Proper authentication and authorization
- [ ] Secure credential handling
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure session management
- [ ] Proper error handling
- [ ] Logging of security events
- [ ] Secure configuration management

## Security Training and Awareness

### Developer Security Training
- Secure coding practices
- Threat modeling
- Security testing techniques
- Incident response procedures

### Security Policies
- Password policies
- Access control policies
- Data handling policies
- Incident response policies

## Continuous Security

### Security Updates
```bash
# Automated dependency updates
npm audit fix
pip install --upgrade -r requirements.txt

# Security patch monitoring
# Subscribe to security advisories
# Regular vulnerability assessments
```

### Security Metrics and KPIs
- Mean time to detect security incidents
- Mean time to respond to security incidents
- Number of security vulnerabilities found
- Security training completion rates
- Security audit compliance scores