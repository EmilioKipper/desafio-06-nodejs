import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

interface TransactionWithCategoryTitle {
  id: string;
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    category,
    title,
    type,
    value,
  }: RequestDTO): Promise<TransactionWithCategoryTitle> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { income } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > income) {
      throw new AppError('Outcome is bigger than total income', 400);
    }

    const categoriesRepository = getRepository(Category);

    const categoryExists = await categoriesRepository.findOne({
      where: { title: category },
    });

    let categoryCreated;

    if (!categoryExists) {
      categoryCreated = categoriesRepository.create({
        title: category,
      });
      await categoriesRepository.save(categoryCreated);
    }

    const transaction: Transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryExists?.id
        ? categoryExists?.id
        : categoryCreated?.id,
    });

    await transactionsRepository.save(transaction);

    return { id: transaction.id, title, value, type, category };
  }
}

export default CreateTransactionService;
