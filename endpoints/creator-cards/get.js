const { createHandler } = require('@app-core/server');
const getCreatorCard = require('@app/services/creator-cards/get-card');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  middlewares: [],
  async handler(rc, helpers) {
    const { slug } = rc.params;
    const accessCode = rc.query.access_code;

    const response = await getCreatorCard(slug, accessCode);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      data: response,
    };
  },
});
