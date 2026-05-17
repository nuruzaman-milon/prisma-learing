class QueryBuilder {
  public modelQuery: any;

  public query: Record<string, unknown>;

  constructor(modelQuery: any, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;

    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm;
    if (searchTerm) {
      this.modelQuery.where = {
        OR: searchableFields.map((field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        })),
      };
    }

    return this;
  }

  paginate() {
    const page = Number(this.query.page) || 1;

    const limit = Number(this.query.limit) || 10;

    const skip = (page - 1) * limit;

    this.modelQuery.skip = skip;

    this.modelQuery.take = limit;

    return this;
  }

  sort() {
    const sort = (this.query.sort as string)?.split(",") || ["-createdAt"];

    const sortFields = sort.map((field) =>
      field.startsWith("-")
        ? {
            [field.substring(1)]: "desc",
          }
        : {
            [field]: "asc",
          },
    );

    this.modelQuery.orderBy = sortFields;

    return this;
  }

  fields() {
    const fields = (this.query.fields as string)?.split(",").join(" ");

    if (fields) {
      const selectedFields = fields
        .split(" ")
        .reduce((acc: Record<string, boolean>, field) => {
          acc[field] = true;

          return acc;
        }, {});

      this.modelQuery.select = selectedFields;
    }

    return this;
  }
}

export default QueryBuilder;
