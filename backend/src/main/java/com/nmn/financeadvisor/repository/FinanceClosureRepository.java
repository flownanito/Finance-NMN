package com.nmn.financeadvisor.repository;

import com.nmn.financeadvisor.model.FinanceClosure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FinanceClosureRepository extends JpaRepository<FinanceClosure, Long> {
    Optional<FinanceClosure> findByDate(String date);
}
