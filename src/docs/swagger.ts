export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'BLS AND COMPANY Enterprise Backend API',
    version: '1.0.0',
    description: 'Complete Backend and Multi-Portal Integration API for BLS AND COMPANY (CA, Taxation & Advisory Firm)',
    contact: {
      name: 'BLS Technology Team',
      email: 'tech@blscompany.com'
    }
  },
  servers: [
    {
      url: 'https://pls.durgaselector.com/api/v1',
      description: 'Production API Server'
    },
    {
      url: 'http://bls.durgagenerator.com/api/v1',
      description: 'Live AWS EC2 API Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate User (Admin, Staff, Partner, Client)',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@blscompany.com' },
                  password: { type: 'string', example: 'Admin@123' },
                  portal: { type: 'string', enum: ['admin', 'partner', 'client'], example: 'admin' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Profile details returned' }
        }
      }
    },
    '/leads/public': {
      post: {
        summary: 'Submit Public Website Enquiry / Lead',
        tags: ['Leads & CRM'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Rahul Sharma' },
                  email: { type: 'string', example: 'rahul@example.com' },
                  phone: { type: 'string', example: '+91 98765 43210' },
                  serviceRequired: { type: 'string', example: 'Company Incorporation' },
                  message: { type: 'string', example: 'Looking to incorporate Pvt Ltd in Delhi' },
                  city: { type: 'string', example: 'New Delhi' }
                },
                required: ['name', 'email', 'phone']
              }
            }
          }
        },
        responses: {
          201: { description: 'Enquiry submitted with reference ID' }
        }
      }
    },
    '/leads': {
      get: {
        summary: 'Get list of Leads (Admin & Staff)',
        tags: ['Leads & CRM'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Paginated leads returned' }
        }
      }
    },
    '/partners/register': {
      post: {
        summary: 'Register new Partner application',
        tags: ['Partners'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'CA Amit Gupta' },
                  email: { type: 'string', example: 'amit.gupta@example.com' },
                  phone: { type: 'string', example: '+91 98111 22334' },
                  profession: { type: 'string', example: 'Chartered Accountant' },
                  firmName: { type: 'string', example: 'Amit Gupta & Associates' },
                  city: { type: 'string', example: 'Mumbai' }
                },
                required: ['name', 'email', 'phone']
              }
            }
          }
        },
        responses: {
          201: { description: 'Partner registered with pending status' }
        }
      }
    },
    '/dashboard/admin': {
      get: {
        summary: 'Get Admin CRM Dashboard Metrics and Financial Aggregates',
        tags: ['Dashboard'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Live aggregates returned' }
        }
      }
    }
  }
};
