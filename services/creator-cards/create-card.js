const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { ulid } = require('@app-core/randomness');
const createRepositoryFactory = require('@app-core/repository-factory');
const CreatorCardMessages = require('@app/messages/creator-card');

const repo = createRepositoryFactory('CreatorCard');

const createCardSpec = `root {
  title string<minLength:3|maxLength:100>
  description? string<maxLength:500>
  slug? string<minLength:5|maxLength:50>
  creator_reference string<length:20>
  links[]? {
    title string<minLength:1|maxLength:100>
    url string<maxLength:200>
  }
  service_rates? {
    currency string
    rates[] {
      name string<minLength:3|maxLength:100>
      description? string<maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<length:6>
}`;

const parsedCreateCardSpec = validator.parse(createCardSpec);

function generateSlug(title) {
  let slug = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '');

  if (slug.length < 5) {
    const suffix = Math.random().toString(36).substring(2, 8);
    slug = `${slug}-${suffix}`;
  }

  return slug;
}

async function ensureUniqueSlug(slug) {
  // Check ALL documents including deleted ones (MongoDB unique index covers all)
  const Model = repo.raw();
  const existing = await Model.findOne({ slug }).lean();
  return !existing;
}

function throwSlugTaken() {
  throwAppError(CreatorCardMessages.SLUG_TAKEN, ERROR_CODE.INVLDDATA, {
    context: { code: 'SL02' },
  });
}

async function createCreatorCard(serviceData) {
  const data = validator.validate(serviceData, parsedCreateCardSpec);

  // Generate slug if not provided
  if (!data.slug) {
    data.slug = generateSlug(data.title);
    let attempts = 0;
    while (!(await ensureUniqueSlug(data.slug)) && attempts < 5) {
      const suffix = Math.random().toString(36).substring(2, 8);
      data.slug = `${generateSlug(data.title)}-${suffix}`;
      attempts++;
    }
  } else {
    // Client-provided slug - check uniqueness strictly (all docs)
    const slugUnique = await ensureUniqueSlug(data.slug);
    if (!slugUnique) {
      throwSlugTaken();
    }
  }

  // Validate link URLs
  if (data.links && data.links.length > 0) {
    data.links = data.links.map((link) => {
      if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
        throwAppError('Link URL must start with http:// or https://', ERROR_CODE.INVLDDATA);
      }
      return link;
    });
  }

  // Access code business rules
  const accessType = data.access_type || 'public';

  if (accessType === 'private' && !data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.INVLDDATA, {
      context: { code: 'AC01' },
    });
  }

  if (accessType === 'public' && data.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, ERROR_CODE.INVLDDATA, {
      context: { code: 'AC05' },
    });
  }

  // Validate service_rates currency
  if (data.service_rates) {
    const validCurrencies = ['NGN', 'USD', 'GBP', 'GHS'];
    if (!validCurrencies.includes(data.service_rates.currency)) {
      throwAppError(
        `Invalid currency. Must be one of: ${validCurrencies.join(', ')}`,
        ERROR_CODE.INVLDDATA
      );
    }
    if (!data.service_rates.rates || data.service_rates.rates.length === 0) {
      throwAppError('Service rates must have at least one rate', ERROR_CODE.INVLDDATA);
    }
  }

  const cardData = {
    _id: ulid(),
    title: data.title,
    description: data.description || '',
    slug: data.slug,
    creator_reference: data.creator_reference,
    links: data.links || [],
    service_rates: data.service_rates || null,
    status: data.status,
    access_type: accessType,
    access_code: accessType === 'private' ? data.access_code : null,
    created: Date.now(),
    updated: Date.now(),
    deleted: null,
  };

  const savedCard = await repo.create(cardData);

  // Transform _id to id for response
  const response = { ...savedCard };
  response.id = response._id;
  delete response._id;
  delete response.__v;

  return response;
}

module.exports = createCreatorCard;
