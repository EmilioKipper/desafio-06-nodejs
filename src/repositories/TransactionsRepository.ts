/* eslint-disable no-await-in-loop */
import { EntityRepository, Repository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

interface ReturnedTransactions {
  id: string;
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: {
    id: string;
    title: string;
  };
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getAllTransactionsWithCategoryObj(): Promise<
    Array<ReturnedTransactions>
  > {
    const transactionRepository = getRepository(Transaction);

    const categoryRepository = getRepository(Category);

    const transactions = await transactionRepository.find();

    const formatedTransactions = [];

    for (let index = 0; index < transactions.length; index += 1) {
      const { id, title, type, value, category_id } = transactions[index];

      const cat = await categoryRepository.findOne({
        where: { id: category_id },
      });

      if (cat) {
        formatedTransactions.push({
          id,
          title,
          type,
          value,
          category: { id: cat.id, title: cat.title },
        });
      }
    }

    return formatedTransactions;
  }

  public async getBalance(): Promise<Balance> {
    const transactionRepository = getRepository(Transaction);
    const transactions = await transactionRepository.find();

    const initialValues = {
      income: 0,
      outcome: 0,
      total: 0,
    };

    const balance = transactions.reduce((obj, currentItem) => {
      const balanceValues = obj;

      if (currentItem.type === 'income')
        balanceValues.income += currentItem.value;

      if (currentItem.type === 'outcome')
        balanceValues.outcome += currentItem.value;

      balanceValues.total = balanceValues.income - balanceValues.outcome;

      return balanceValues;
    }, initialValues);

    return balance;
  }
}

export default TransactionsRepository;
