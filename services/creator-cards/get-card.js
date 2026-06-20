const createRepositoryFactory = require('@app-core/repository-factory');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCardMessages = require('@app/messages/creator-card');

const repo = createRepositoryFactory('CreatorCard');

async function getCreatorCard(slug, accessCode) {
  const card = await repo.findOne({ query: { slug, deleted: null } });

  // 1. Card not found
  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NOTFOUND, {
      context: { code: 'NF01' },
    });
  }

  // 2. Card is draft - return 404
  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.CARD_NOT_PUBLISHED, ERROR_CODE.NOTFOUND, {
      context: { code: 'NF02' },
    });
  }

  // 3. Private card - no access code -> 403
  if (card.access_type === 'private' && !accessCode) {
    throwAppError(CreatorCardMessages.ACCESS_DENIED_NO_CODE, ERROR_CODE.INVLDREQ, {
      context: { code: 'AC03' },
    });
  }

  // 4. Private card - wrong access code -> 403
  if (card.access_type === 'private' && accessCode !== card.access_code) {
    throwAppError(CreatorCardMessages.ACCESS_DENIED_WRONG_CODE, ERROR_CODE.INVLDREQ, {
      context: { code: 'AC04' },
    });
  }

  // Transform _id to id, omit access_code
  const response = { ...card };
  response.id = response._id;
  delete response._id;
  delete response.__v;
  delete response.access_code;

  return response;
}

module.exports = getCreatorCard;
