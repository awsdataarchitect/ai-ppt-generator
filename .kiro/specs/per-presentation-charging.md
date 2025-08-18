# Per-Presentation Charging - Future Feature Specification

## Overview

**Implementation Date**: TBD (Next Phase)  
**Charging Model**: $1 per presentation generation  
**Payment Processor**: Stripe  
**Admin User**: Configured via `ADMIN_USER` environment variable (no charges)  

## Business Model

### Pricing Structure
- **Cost**: $1.00 USD per presentation generated
- **Payment Method**: Credit card via Stripe
- **Billing**: Pay-per-use (no subscription)
- **Admin Exemption**: Unlimited free usage for admin user (set via `ADMIN_USER` env var)

### User Experience
1. **New Users**: Must add payment method before generating presentations
2. **Existing Users**: Grandfathered until first presentation attempt
3. **Admin User**: No payment required, unlimited usage (configured via environment)
4. **Payment Flow**: Charge immediately upon successful presentation generation

## Technical Implementation

### Architecture Components

#### 1. Payment Processing
```python
# New Lambda Function: presentation_payment_processor.py
def charge_for_presentation(user_id: str, presentation_id: str) -> Dict[str, Any]:
    """
    Charge $1 for presentation generation
    Skip charging for admin user
    """
    # Check if user is admin (free usage)
    if is_admin_user(user_id):
        return {"charged": False, "reason": "admin_exemption"}
    
    # Process Stripe payment
    stripe_charge = stripe.Charge.create(
        amount=100,  # $1.00 in cents
        currency='usd',
        customer=get_stripe_customer_id(user_id),
        description=f'AI Presentation Generation - {presentation_id}'
    )
    
    return {"charged": True, "charge_id": stripe_charge.id}
```

#### 2. User Management
```python
# Enhanced user_payment_resolver.py
def setup_payment_method(user_id: str, payment_method_id: str) -> Dict[str, Any]:
    """
    Set up Stripe customer and payment method
    """
    customer = stripe.Customer.create(
        email=get_user_email(user_id),
        payment_method=payment_method_id
    )
    
    # Store Stripe customer ID in DynamoDB
    update_user_payment_info(user_id, customer.id)
    
    return {"success": True, "customer_id": customer.id}
```

#### 3. Presentation Generation Integration
```python
# Modified rag_presentation_resolver.py
def generate_presentation_with_rag(event, context):
    """
    Enhanced with payment processing
    """
    user_id = event['identity']['sub']
    
    # Check payment requirement
    if not is_admin_user(user_id) and not has_valid_payment_method(user_id):
        return {
            "success": False,
            "requiresPayment": True,
            "message": "Payment method required for presentation generation"
        }
    
    # Generate presentation
    presentation = generate_presentation(...)
    
    # Process payment after successful generation
    if presentation["success"] and not is_admin_user(user_id):
        payment_result = charge_for_presentation(user_id, presentation["id"])
        presentation["payment"] = payment_result
    
    return presentation
```

### Database Schema

#### User Payment Information
```python
# DynamoDB Table: ai-ppt-user-payments
{
    'user_id': 'cognito-user-uuid',           # Primary Key
    'stripe_customer_id': 'cus_stripe_id',    # Stripe customer ID
    'payment_method_id': 'pm_stripe_id',      # Default payment method
    'total_presentations': 15,                # Usage tracking
    'total_charged': 15.00,                   # Total amount charged
    'last_charge_date': '2025-08-19T10:00:00Z',
    'payment_status': 'active',               # active, suspended, failed
    'created_at': '2025-08-19T09:00:00Z'
}
```

#### Payment History
```python
# DynamoDB Table: ai-ppt-payment-history
{
    'payment_id': 'pay_unique_id',            # Primary Key
    'user_id': 'cognito-user-uuid',           # GSI
    'presentation_id': 'pres_unique_id',      # Presentation reference
    'stripe_charge_id': 'ch_stripe_id',       # Stripe charge ID
    'amount': 100,                            # Amount in cents
    'currency': 'usd',
    'status': 'succeeded',                    # succeeded, failed, pending
    'charged_at': '2025-08-19T10:00:00Z',
    'presentation_title': 'AI in Healthcare'
}
```

### Frontend Integration

#### Payment Setup Component
```javascript
// PaymentSetup.jsx
const PaymentSetup = ({ onPaymentSetup }) => {
    const [stripe] = useStripe();
    const [elements] = useElements();
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        const cardElement = elements.getElement(CardElement);
        const {paymentMethod} = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });
        
        // Save payment method via GraphQL
        await setupPaymentMethod(paymentMethod.id);
        onPaymentSetup();
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <CardElement />
            <button type="submit">Add Payment Method ($1 per presentation)</button>
        </form>
    );
};
```

#### Payment Required Modal
```javascript
// PaymentRequiredModal.jsx
const PaymentRequiredModal = ({ isOpen, onClose, onPaymentSetup }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2>Payment Required</h2>
            <p>Presentation generation costs $1.00 per presentation.</p>
            <p>Add a payment method to continue.</p>
            <PaymentSetup onPaymentSetup={onPaymentSetup} />
        </Modal>
    );
};
```

### GraphQL Schema Extensions

```graphql
# Payment-related types
type PaymentInfo {
    hasPaymentMethod: Boolean!
    totalPresentations: Int!
    totalCharged: Float!
    lastChargeDate: String
}

type PresentationResult {
    id: String!
    title: String!
    slides: [Slide!]!
    success: Boolean!
    requiresPayment: Boolean
    payment: PaymentResult
    # ... existing fields
}

type PaymentResult {
    charged: Boolean!
    chargeId: String
    reason: String
}

# Mutations
type Mutation {
    setupPaymentMethod(paymentMethodId: String!): PaymentSetupResult!
    # ... existing mutations
}

type PaymentSetupResult {
    success: Boolean!
    customerId: String
    message: String
}

# Queries
type Query {
    getUserPaymentInfo: PaymentInfo!
    getPaymentHistory(limit: Int): [PaymentHistoryItem!]!
    # ... existing queries
}

type PaymentHistoryItem {
    paymentId: String!
    presentationId: String!
    presentationTitle: String!
    amount: Float!
    status: String!
    chargedAt: String!
}
```

## Implementation Plan

### Phase 1: Infrastructure Setup
1. **Stripe Account Setup**
   - Configure Stripe account for production
   - Set up webhooks for payment status updates
   - Configure payment methods and currencies

2. **Database Schema**
   - Create user payments table
   - Create payment history table
   - Set up GSI for user-based queries

3. **Lambda Functions**
   - `presentation_payment_processor.py`
   - `user_payment_resolver.py`
   - `payment_history_resolver.py`

### Phase 2: Backend Integration
1. **Payment Processing Logic**
   - Integrate Stripe SDK
   - Implement charging logic
   - Add owner exemption logic

2. **Presentation Generation Enhancement**
   - Add payment checks to presentation generation
   - Implement payment processing after successful generation
   - Add error handling for payment failures

3. **GraphQL Schema Updates**
   - Add payment-related types and mutations
   - Update existing resolvers

### Phase 3: Frontend Integration
1. **Payment Setup UI**
   - Payment method collection form
   - Stripe Elements integration
   - Payment status display

2. **User Experience Flow**
   - Payment required modal
   - Payment confirmation
   - Usage tracking display

3. **Error Handling**
   - Payment failure handling
   - Retry mechanisms
   - User feedback

### Phase 4: Testing & Deployment
1. **Testing**
   - Unit tests for payment processing
   - Integration tests with Stripe
   - End-to-end user flow testing

2. **Monitoring**
   - Payment success/failure metrics
   - Revenue tracking
   - User conversion analytics

3. **Deployment**
   - Gradual rollout
   - A/B testing for pricing
   - User communication

## Security Considerations

### Payment Security
- **PCI Compliance**: Use Stripe Elements (no card data touches our servers)
- **API Keys**: Store Stripe keys in AWS Secrets Manager
- **Webhook Verification**: Verify Stripe webhook signatures
- **Idempotency**: Prevent duplicate charges

### User Privacy
- **Data Minimization**: Store only necessary payment metadata
- **Encryption**: Encrypt sensitive payment data at rest
- **Access Control**: Restrict payment data access to authorized functions
- **Audit Logging**: Log all payment-related actions

## Business Metrics

### Key Performance Indicators
- **Conversion Rate**: % of users who add payment methods
- **Revenue per User**: Average revenue generated per user
- **Churn Rate**: % of users who stop using after payment requirement
- **Payment Success Rate**: % of successful payment transactions

### Success Criteria
- **Target Conversion**: >60% of active users add payment methods
- **Payment Success**: >95% payment success rate
- **User Retention**: <20% churn rate after payment implementation
- **Revenue Goal**: $500+ monthly recurring revenue within 3 months
- **Admin Exemption**: 100% success rate for admin user (no charges)

## Admin Exemption Logic

### Environment Configuration
```bash
# .env file
ADMIN_USER=admin@example.com
```

### Implementation
```python
def is_admin_user(user_id: str) -> bool:
    """
    Check if user is the admin (configured via ADMIN_USER environment variable)
    """
    try:
        # Get admin email from environment
        admin_email = os.environ.get('ADMIN_USER', '').lower().strip()
        if not admin_email:
            logger.warning("ADMIN_USER environment variable not set")
            return False
        
        # Get user email from Cognito
        cognito = boto3.client('cognito-idp')
        response = cognito.admin_get_user(
            UserPoolId=USER_POOL_ID,
            Username=user_id
        )
        
        # Find email attribute
        for attr in response['UserAttributes']:
            if attr['Name'] == 'email':
                return attr['Value'].lower() == admin_email
        
        return False
    except Exception as e:
        logger.error(f"Error checking admin status: {e}")
        return False
```

### Testing Admin Exemption
```python
def test_admin_exemption():
    """
    Test that admin gets free presentations
    """
    # Mock admin user
    admin_result = generate_presentation_with_rag(admin_event)
    assert admin_result['success'] == True
    assert 'payment' not in admin_result or admin_result['payment']['charged'] == False
    
    # Mock regular user
    user_result = generate_presentation_with_rag(user_event)
    assert user_result['requiresPayment'] == True or user_result['payment']['charged'] == True
```

### Security Considerations
- **Environment Variable**: Store admin email securely in environment variables
- **Case Insensitive**: Email comparison is case-insensitive
- **Validation**: Proper error handling if environment variable is missing
- **Logging**: Log admin exemptions for audit purposes (without exposing email)

## Migration Strategy

### Existing Users
1. **Grandfathering Period**: 30 days notice before payment requirement
2. **Email Notification**: Inform users about upcoming payment requirement
3. **Gradual Rollout**: Start with new users, then existing users
4. **Support**: Provide clear documentation and support for payment setup

### Data Migration
1. **User Identification**: Identify existing users vs new users
2. **Payment Status**: Set existing users as "grandfathered" initially
3. **Usage Tracking**: Start tracking presentation generation for all users
4. **Billing Cutover**: Implement payment requirement after grace period

## Status

- 📋 **Specification**: Complete
- ⏳ **Implementation**: Planned for next phase
- 🎯 **Target**: Simple pay-per-use model with owner exemption
- 💰 **Revenue Model**: $1 per presentation (no subscription complexity)
- 🔒 **Security**: PCI-compliant via Stripe Elements
- 📊 **Analytics**: Usage and revenue tracking built-in
